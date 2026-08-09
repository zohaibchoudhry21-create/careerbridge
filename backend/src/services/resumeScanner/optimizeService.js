/**
 * Optimize-mode business logic: suggestions, manual edits, undo/redo.
 * Preserves existing accept/reject/accept-all/text-update behavior.
 */

import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import {
  canRedo,
  canUndo,
  pushHistoryEntry,
  redoAnalysis,
  undoAnalysis,
} from '../../utils/resumeScannerHistory.js';
import {
  ensureAnalysisParsedData,
  normalizeParsedData,
  parsedDataToStructuredResume,
} from '../../utils/resumeScannerParsedData.js';
import { sanitizeResumeScannerText } from '../../utils/resumeScannerTextUtils.js';
import {
  applySuggestionToStructured,
  cloneStructuredResume,
  parseAtsTextToStructured,
  setFieldByPath,
} from '../../utils/structuredResume.js';
import { AppError } from '../../utils/sendResponse.js';
import {
  loadAnalysisForUser,
  loadJobDescription,
  withOptimisticRetry,
} from './analysisPersistence.js';
import { refreshFinalizedSnapshotIfNeeded } from './finalizeService.js';
import {
  captureJobMatchSnapshot,
  enforceAcceptJobMatchFloor,
  ensureStructuredResume,
  expireStalePendingSuggestions,
  recomputeAndSave,
  refreshSkillState,
  syncAfterHistoryRestore,
  syncDerivedFromStructured,
} from './structureService.js';

const VALID_TEMPLATE_IDS = new Set(['classic', 'modern', 'minimal', 'professional', 'elegant']);

const assertCompleted = (analysis) => {
  if (analysis.status !== 'completed') {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
  }
};

export const updateSuggestionStatus = async ({
  analysisId,
  userId,
  suggestionId,
  action,
}) => {
  return withOptimisticRetry(analysisId, userId, async (analysis) => {
    assertCompleted(analysis);

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);
    const suggestion = analysis.suggestions.find((item) => item.id === suggestionId);

    if (!suggestion) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.SUGGESTION_NOT_FOUND, 404);
    }

    if (suggestion.status !== 'pending') {
      return { early: true, analysis, jobDescription };
    }

    const jobMatchSnapshot = action === 'accept' ? captureJobMatchSnapshot(analysis) : null;

    pushHistoryEntry(analysis, `suggestion:${action}`);

    if (action === 'accept') {
      const applyResult = applySuggestionToStructured(
        ensureStructuredResume(analysis),
        suggestion
      );
      if (applyResult.applied) {
        syncDerivedFromStructured(analysis, applyResult.structured);
        suggestion.status = 'accepted';
        suggestion.applyError = '';
      } else {
        suggestion.status = 'unappliable';
        suggestion.applyError = applyResult.reason || 'original_not_found_in_field';
      }
    } else {
      suggestion.status = 'rejected';
    }

    await recomputeAndSave(analysis, jobDescription);
    if (action === 'accept' && jobMatchSnapshot) {
      enforceAcceptJobMatchFloor(analysis, jobMatchSnapshot);
      if (analysis.isModified()) {
        await analysis.save();
      }
    }
    return { early: false, analysis, jobDescription };
  });
};

export const acceptAllSuggestions = async ({ analysisId, userId }) => {
  return withOptimisticRetry(analysisId, userId, async (analysis) => {
    assertCompleted(analysis);

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);
    const pendingSuggestions = analysis.suggestions.filter((item) => item.status === 'pending');

    if (!pendingSuggestions.length) {
      return { early: true, analysis, jobDescription };
    }

    const jobMatchSnapshot = captureJobMatchSnapshot(analysis);
    pushHistoryEntry(analysis, 'accept-all');

    let structured = ensureStructuredResume(analysis);
    for (const suggestion of pendingSuggestions) {
      const applyResult = applySuggestionToStructured(structured, suggestion);
      if (applyResult.applied) {
        structured = applyResult.structured;
        suggestion.status = 'accepted';
        suggestion.applyError = '';
      } else {
        suggestion.status = 'unappliable';
        suggestion.applyError = applyResult.reason || 'original_not_found_in_field';
      }
    }
    syncDerivedFromStructured(analysis, structured);
    await recomputeAndSave(analysis, jobDescription);
    enforceAcceptJobMatchFloor(analysis, jobMatchSnapshot);
    if (analysis.isModified()) {
      await analysis.save();
    }
    return { early: false, analysis, jobDescription };
  });
};

export const updateResumeText = async ({ analysisId, userId, body }) => {
  return withOptimisticRetry(analysisId, userId, async (analysis) => {
    assertCompleted(analysis);

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);

    pushHistoryEntry(analysis, 'manual-edit');

    let structured = ensureStructuredResume(analysis);
    let templateOnly = false;

    if (body.parsedData && typeof body.parsedData === 'object') {
      const parsed = normalizeParsedData(body.parsedData);
      analysis.parsedData = parsed;
      analysis.markModified('parsedData');
      if (body.templateId && VALID_TEMPLATE_IDS.has(String(body.templateId))) {
        analysis.templateId = String(body.templateId);
      }
      structured = parsedDataToStructuredResume(parsed);
    } else if (body.structuredResume && typeof body.structuredResume === 'object') {
      structured = cloneStructuredResume(body.structuredResume);
    } else if (body.path != null && Object.prototype.hasOwnProperty.call(body, 'value')) {
      const nextStructured = setFieldByPath(structured, String(body.path), body.value);
      if (!nextStructured) {
        throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
      }
      structured = nextStructured;
    } else if (typeof body.resumeText === 'string' && body.resumeText.trim()) {
      structured = parseAtsTextToStructured(sanitizeResumeScannerText(body.resumeText));
    } else if (body.templateId && VALID_TEMPLATE_IDS.has(String(body.templateId))) {
      analysis.templateId = String(body.templateId);
      ensureAnalysisParsedData(analysis);
      templateOnly = true;
    } else {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
    }

    if (!templateOnly) {
      syncDerivedFromStructured(analysis, structured);
      expireStalePendingSuggestions(analysis);
      refreshFinalizedSnapshotIfNeeded(analysis);
    }

    await recomputeAndSave(analysis, jobDescription);
    return {
      analysis,
      jobDescription,
      message: templateOnly
        ? 'Template updated successfully.'
        : 'Resume text updated successfully.',
    };
  });
};

export const undoChange = async ({ analysisId, userId }) => {
  const analysis = await loadAnalysisForUser(analysisId, userId);

  if (!canUndo(analysis)) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.NOTHING_TO_UNDO, 400);
  }

  undoAnalysis(analysis);
  syncAfterHistoryRestore(analysis);
  const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);
  refreshSkillState(analysis, jobDescription);
  await analysis.save();

  return { analysis, jobDescription };
};

export const redoChange = async ({ analysisId, userId }) => {
  const analysis = await loadAnalysisForUser(analysisId, userId);

  if (!canRedo(analysis)) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.NOTHING_TO_REDO, 400);
  }

  redoAnalysis(analysis);
  syncAfterHistoryRestore(analysis);
  const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);
  refreshSkillState(analysis, jobDescription);
  await analysis.save();

  return { analysis, jobDescription };
};
