/**
 * Resume Scanner Orchestrator
 *
 * Single entry point for controller handlers. Coordinates JobService,
 * OptimizeService, RewriteLifecycleService, and persistence — no HTTP.
 */

import ScannedResume from '../../models/ScannedResume.js';
import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import { AppError } from '../../utils/sendResponse.js';
import {
  loadAnalysisForUser,
  loadAnalysisStatusForUser,
  loadJobDescription,
  serializeAnalysisForUser,
} from './analysisPersistence.js';
import {
  createAnalysisJob,
  enqueueAnalysisPipeline,
} from './jobService.js';
import * as finalizeService from './finalizeService.js';
import * as optimizeService from './optimizeService.js';
import * as rewriteLifecycleService from './rewriteLifecycleService.js';
import {
  ensureAnalysisStructureForRead,
  refreshSkillState,
} from './structureService.js';

export const startUploadAnalysis = async ({ userId, file, jobDescriptionText }) => {
  const analysis = await createAnalysisJob({
    userId,
    file,
    jobDescriptionText,
  });

  enqueueAnalysisPipeline(analysis._id, userId, { file });

  return {
    analysisId: analysis._id,
    status: analysis.status,
    progress: analysis.progress,
  };
};

export const getStatus = async ({ analysisId, userId }) => {
  const analysis = await loadAnalysisStatusForUser(analysisId, userId);
  return {
    analysisId: analysis._id,
    status: analysis.status,
    progress: analysis.progress,
    statusMessage: analysis.statusMessage,
    errorMessage: analysis.errorMessage,
  };
};

export const getAnalysis = async ({ analysisId, userId }) => {
  const analysis = await loadAnalysisForUser(analysisId, userId);

  if (analysis.status !== 'completed') {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
  }

  const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);

  if (!analysis.lineMap?.length && analysis.resumeSourceType === 'scanned') {
    const scannedResume = await ScannedResume.findOne({
      _id: analysis.resumeSourceId,
      userId,
    }).select('lineMap extractionMetadata');

    if (scannedResume?.lineMap?.length) {
      analysis.lineMap = scannedResume.lineMap;
    }
  }

  refreshSkillState(analysis, jobDescription);
  await ensureAnalysisStructureForRead(analysis);

  return {
    analysis: await serializeAnalysisForUser(analysis, jobDescription, userId),
  };
};

export const updateSuggestionStatus = async ({
  analysisId,
  userId,
  suggestionId,
  action,
}) => {
  const result = await optimizeService.updateSuggestionStatus({
    analysisId,
    userId,
    suggestionId,
    action,
  });

  return {
    early: result.early,
    analysis: await serializeAnalysisForUser(
      result.analysis,
      result.jobDescription,
      userId
    ),
  };
};

export const acceptAllSuggestions = async ({ analysisId, userId }) => {
  const result = await optimizeService.acceptAllSuggestions({ analysisId, userId });

  return {
    early: result.early,
    analysis: await serializeAnalysisForUser(
      result.analysis,
      result.jobDescription,
      userId
    ),
  };
};

export const updateResumeText = async ({ analysisId, userId, body }) => {
  const result = await optimizeService.updateResumeText({
    analysisId,
    userId,
    body,
  });

  return {
    message: result.message,
    analysis: await serializeAnalysisForUser(
      result.analysis,
      result.jobDescription,
      userId
    ),
  };
};

export const undoChange = async ({ analysisId, userId }) => {
  const result = await optimizeService.undoChange({ analysisId, userId });
  return {
    analysis: await serializeAnalysisForUser(
      result.analysis,
      result.jobDescription,
      userId
    ),
  };
};

export const redoChange = async ({ analysisId, userId }) => {
  const result = await optimizeService.redoChange({ analysisId, userId });
  return {
    analysis: await serializeAnalysisForUser(
      result.analysis,
      result.jobDescription,
      userId
    ),
  };
};

export const updateRewriteStatus = async ({ analysisId, userId, action }) => {
  const result = await rewriteLifecycleService.updateRewriteStatus({
    analysisId,
    userId,
    action,
  });

  return {
    action: result.action,
    analysis: await serializeAnalysisForUser(
      result.analysis,
      result.jobDescription,
      userId
    ),
  };
};

export const finalizeAnalysis = async ({ analysisId, userId }) =>
  finalizeService.finalizeAnalysis({ analysisId, userId });

export const downloadPdf = async ({ analysisId, userId }) =>
  finalizeService.downloadFinalizedPdf({ analysisId, userId });
