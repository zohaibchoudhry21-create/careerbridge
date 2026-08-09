/**
 * Finalize lifecycle — snapshots structuredResume for PDF generation.
 */

import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import {
  cloneStructuredResume,
  hasStructuredResumeData,
} from '../../utils/structuredResume.js';
import { AppError } from '../../utils/sendResponse.js';
import {
  loadAnalysisForUser,
  loadJobDescription,
  serializeAnalysisForUser,
  withOptimisticRetry,
} from './analysisPersistence.js';
import { ensureStructuredResume, syncDerivedFromStructured } from './structureService.js';
import {
  buildPdfFilename,
  generatePdfFromStructuredResume,
} from './pdfService.js';

export const canDownloadPdf = (analysis) => {
  if (!analysis || analysis.status !== 'completed') return false;
  if (analysis.rewriteStatus === 'pending_review') return false;
  if (!analysis.finalizedAt) return false;
  return hasStructuredResumeData(analysis.finalizedStructuredResume);
};

/** Snapshot current working structured resume as the finalized PDF source. */
export const snapshotFinalizedResume = (analysis) => {
  const structured = ensureStructuredResume(analysis);
  if (!hasStructuredResumeData(structured)) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
  }
  analysis.finalizedStructuredResume = cloneStructuredResume(structured);
  analysis.finalizedAt = new Date();
  analysis.markModified('finalizedStructuredResume');
};

/** Keep finalized snapshot in sync when user edits after finalize. */
export const refreshFinalizedSnapshotIfNeeded = (analysis) => {
  if (!analysis.finalizedAt) return;
  if (analysis.rewriteStatus === 'pending_review') return;
  const structured = ensureStructuredResume(analysis);
  if (!hasStructuredResumeData(structured)) return;
  analysis.finalizedStructuredResume = cloneStructuredResume(structured);
  analysis.finalizedAt = new Date();
  analysis.markModified('finalizedStructuredResume');
};

export const finalizeAnalysis = async ({ analysisId, userId }) => {
  return withOptimisticRetry(analysisId, userId, async (analysis) => {
    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }
    if (analysis.rewriteStatus === 'pending_review') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.REWRITE_NOT_AVAILABLE, 409);
    }

    snapshotFinalizedResume(analysis);
    // Ensure derived fields stay consistent with working structured resume
    syncDerivedFromStructured(analysis, ensureStructuredResume(analysis));
    await analysis.save();

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);
    return {
      analysis: await serializeAnalysisForUser(analysis, jobDescription, userId),
    };
  });
};

export const downloadFinalizedPdf = async ({ analysisId, userId }) => {
  const analysis = await loadAnalysisForUser(analysisId, userId);

  if (analysis.status !== 'completed') {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
  }
  if (analysis.rewriteStatus === 'pending_review') {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.PDF_NOT_AVAILABLE, 409);
  }
  if (!canDownloadPdf(analysis)) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.PDF_NOT_AVAILABLE, 409);
  }

  const finalized = cloneStructuredResume(analysis.finalizedStructuredResume);
  const buffer = await generatePdfFromStructuredResume(finalized, {
    title: finalized.name || 'Resume',
  });

  return {
    buffer,
    filename: buildPdfFilename(finalized, analysisId),
    contentType: 'application/pdf',
  };
};
