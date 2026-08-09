/**
 * Persistence helpers for Resume Scanner analyses.
 * Owns load/save/retry/serialize — no HTTP concerns.
 */

import AtsAnalysis from '../../models/AtsAnalysis.js';
import JobDescription from '../../models/JobDescription.js';
import ScannedResume from '../../models/ScannedResume.js';
import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import { serializeAtsAnalysis } from '../../utils/resumeScannerSerializer.js';
import { AppError } from '../../utils/sendResponse.js';

const OPTIMISTIC_RETRY_ATTEMPTS = 3;

const isVersionConflictError = (error) =>
  error?.name === 'VersionError' ||
  error?.name === 'DocumentNotFoundError' ||
  /No matching document found for id/i.test(String(error?.message || ''));

/**
 * Re-run a read-modify-write block when optimisticConcurrency version conflicts.
 * `fn` receives a freshly loaded analysis and must call analysis.save() itself.
 */
export const withOptimisticRetry = async (analysisId, userId, fn) => {
  let lastError;
  for (let attempt = 0; attempt < OPTIMISTIC_RETRY_ATTEMPTS; attempt += 1) {
    const analysis = await loadAnalysisForUser(analysisId, userId);
    try {
      return await fn(analysis, attempt);
    } catch (error) {
      lastError = error;
      if (!isVersionConflictError(error) || attempt === OPTIMISTIC_RETRY_ATTEMPTS - 1) {
        throw error;
      }
    }
  }
  throw lastError;
};

export const loadAnalysisForUser = async (analysisId, userId) => {
  const analysis = await AtsAnalysis.findOne({ _id: analysisId, userId });

  if (!analysis) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }

  return analysis;
};

/** Lean projection for status polling — avoids loading history/suggestions payloads. */
export const loadAnalysisStatusForUser = async (analysisId, userId) => {
  const analysis = await AtsAnalysis.findOne({ _id: analysisId, userId })
    .select('status progress statusMessage errorMessage')
    .lean();

  if (!analysis) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }

  return analysis;
};

export const loadJobDescription = async (jobDescriptionId, userId) => {
  const jobDescription = await JobDescription.findOne({ _id: jobDescriptionId, userId });
  if (!jobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }
  return jobDescription;
};

export const loadExtractionMetadata = async (analysis, userId) => {
  if (analysis.resumeSourceType !== 'scanned' || !analysis.resumeSourceId) {
    return null;
  }
  const scannedResume = await ScannedResume.findOne({
    _id: analysis.resumeSourceId,
    userId,
  }).select('extractionMetadata');
  return scannedResume?.extractionMetadata || null;
};

export const serializeAnalysisForUser = async (analysis, jobDescription, userId) => {
  const extractionMetadata = await loadExtractionMetadata(analysis, userId);
  return serializeAtsAnalysis(analysis, jobDescription, { extractionMetadata });
};

export const updateAnalysisProgress = async (
  analysisId,
  { status, progress, statusMessage, errorMessage }
) => {
  await AtsAnalysis.findByIdAndUpdate(analysisId, {
    ...(status ? { status } : {}),
    ...(typeof progress === 'number' ? { progress } : {}),
    ...(statusMessage !== undefined ? { statusMessage } : {}),
    ...(errorMessage !== undefined ? { errorMessage } : {}),
  });
};
