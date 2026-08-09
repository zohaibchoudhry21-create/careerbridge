/**
 * Rewrite accept/reject lifecycle — preserves existing dual-mode behavior.
 * Does not change Decision Engine, rewrite pipeline, or validation logic.
 */

import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import { analyzeResumeAgainstJob } from '../../utils/resumeScannerAiService.js';
import { pushHistoryEntry } from '../../utils/resumeScannerHistory.js';
import { normalizeParsedData } from '../../utils/resumeScannerParsedData.js';
import {
  cloneStructuredResume,
  hasStructuredResumeData,
} from '../../utils/structuredResume.js';
import { AppError } from '../../utils/sendResponse.js';
import {
  loadJobDescription,
  withOptimisticRetry,
} from './analysisPersistence.js';
import {
  recomputeAndSave,
  refreshSkillState,
  syncDerivedFromStructured,
} from './structureService.js';

export const updateRewriteStatus = async ({ analysisId, userId, action }) => {
  const normalizedAction = String(action || '').trim();
  if (!['accept', 'reject'].includes(normalizedAction)) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.INVALID_REWRITE_ACTION, 400);
  }

  return withOptimisticRetry(analysisId, userId, async (analysis) => {
    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    if (analysis.analysisMode !== 'rewrite' || analysis.rewriteStatus !== 'pending_review') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.REWRITE_NOT_AVAILABLE, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);
    pushHistoryEntry(analysis, `rewrite:${normalizedAction}`);

    if (normalizedAction === 'accept') {
      const rewritten = cloneStructuredResume(analysis.rewrittenResume);
      if (!hasStructuredResumeData(rewritten)) {
        throw new AppError(ERROR_CODES.RESUME_SCANNER.REWRITE_NOT_AVAILABLE, 409);
      }

      syncDerivedFromStructured(analysis, rewritten);
      if (analysis.rewrittenParsedData && Object.keys(analysis.rewrittenParsedData).length) {
        analysis.parsedData = normalizeParsedData(analysis.rewrittenParsedData);
        analysis.markModified('parsedData');
      }

      analysis.rewriteStatus = 'accepted';
      analysis.analysisMode = 'optimize';
      analysis.rewrittenResume = {};
      analysis.rewrittenParsedData = {};
      analysis.rewriteNotes = [];

      const postRewriteAi = await analyzeResumeAgainstJob({
        resumeText: analysis.resumeText,
        jobDescriptionText: jobDescription.rawText,
        jobTitle: jobDescription.title || '',
        structuredSections: analysis.structuredSections,
        structuredResume: analysis.structuredResume,
      });

      analysis.suggestions = postRewriteAi.suggestions;
      analysis.searchabilityIssues = postRewriteAi.searchabilityIssues;
      analysis.recruiterTips = postRewriteAi.recruiterTips;
      analysis.atsScore = postRewriteAi.atsScore;
      analysis.jobMatchScore = postRewriteAi.jobMatchScore;
      analysis.score = postRewriteAi.jobMatchScore;
      analysis.atsScoreBreakdown = postRewriteAi.atsScoreBreakdown;
      analysis.jobMatchBreakdown = postRewriteAi.jobMatchBreakdown;
      analysis.matchedSkillIds = postRewriteAi.matchedSkillIds;
      analysis.missingSkillIds = postRewriteAi.missingSkillIds;
      analysis.pendingOptimizationSuggestions = [];
      refreshSkillState(analysis, jobDescription);
    } else {
      analysis.rewriteStatus = 'rejected';
      analysis.analysisMode = 'optimize';
      analysis.suggestions = analysis.pendingOptimizationSuggestions || [];
      analysis.pendingOptimizationSuggestions = [];
      analysis.rewrittenResume = {};
      analysis.rewrittenParsedData = {};
      analysis.rewriteNotes = [];
      await recomputeAndSave(analysis, jobDescription);
    }

    await analysis.save();
    return { analysis, jobDescription, action: normalizedAction };
  });
};
