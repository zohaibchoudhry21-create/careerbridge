/**
 * Thin HTTP adapter for Resume Scanner.
 * Business logic lives in services/resumeScanner (Orchestrator + services).
 */

import * as orchestrator from '../services/resumeScanner/resumeScannerOrchestrator.js';
import { sendResponse } from '../utils/sendResponse.js';

export const uploadAndAnalyzeResume = async (req, res, next) => {
  try {
    const payload = await orchestrator.startUploadAnalysis({
      userId: req.user._id,
      file: req.file,
      jobDescriptionText: req.body.jobDescription,
    });

    sendResponse(res, 202, true, 'Resume scanner analysis started.', payload);
  } catch (error) {
    next(error);
  }
};

export const getResumeScannerStatus = async (req, res, next) => {
  try {
    const payload = await orchestrator.getStatus({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    sendResponse(res, 200, true, 'Analysis status fetched successfully.', payload);
  } catch (error) {
    next(error);
  }
};

export const getResumeScannerAnalysis = async (req, res, next) => {
  try {
    const payload = await orchestrator.getAnalysis({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    sendResponse(res, 200, true, 'Analysis fetched successfully.', payload);
  } catch (error) {
    next(error);
  }
};

export const updateSuggestionStatus = async (req, res, next) => {
  try {
    const result = await orchestrator.updateSuggestionStatus({
      analysisId: req.params.analysisId,
      userId: req.user._id,
      suggestionId: req.params.suggestionId,
      action: req.body.action,
    });

    const message = result.early
      ? 'Suggestion already processed.'
      : 'Suggestion updated successfully.';

    sendResponse(res, 200, true, message, { analysis: result.analysis });
  } catch (error) {
    next(error);
  }
};

export const acceptAllSuggestions = async (req, res, next) => {
  try {
    const result = await orchestrator.acceptAllSuggestions({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    const message = result.early
      ? 'No pending suggestions to accept.'
      : 'All suggestions accepted successfully.';

    sendResponse(res, 200, true, message, { analysis: result.analysis });
  } catch (error) {
    next(error);
  }
};

export const updateResumeScannerText = async (req, res, next) => {
  try {
    const result = await orchestrator.updateResumeText({
      analysisId: req.params.analysisId,
      userId: req.user._id,
      body: req.body,
    });

    sendResponse(res, 200, true, result.message, { analysis: result.analysis });
  } catch (error) {
    next(error);
  }
};

export const undoResumeScannerChange = async (req, res, next) => {
  try {
    const result = await orchestrator.undoChange({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    sendResponse(res, 200, true, 'Undo applied successfully.', {
      analysis: result.analysis,
    });
  } catch (error) {
    next(error);
  }
};

export const redoResumeScannerChange = async (req, res, next) => {
  try {
    const result = await orchestrator.redoChange({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    sendResponse(res, 200, true, 'Redo applied successfully.', {
      analysis: result.analysis,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRewriteStatus = async (req, res, next) => {
  try {
    const result = await orchestrator.updateRewriteStatus({
      analysisId: req.params.analysisId,
      userId: req.user._id,
      action: req.body.action,
    });

    const message =
      result.action === 'accept'
        ? 'AI rewritten resume applied successfully.'
        : 'Kept original resume. Optimization suggestions restored.';

    sendResponse(res, 200, true, message, { analysis: result.analysis });
  } catch (error) {
    next(error);
  }
};

export const finalizeResumeScannerAnalysis = async (req, res, next) => {
  try {
    const result = await orchestrator.finalizeAnalysis({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    sendResponse(res, 200, true, 'Resume finalized successfully.', {
      analysis: result.analysis,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadResumeScannerPdf = async (req, res, next) => {
  try {
    const { buffer, filename, contentType } = await orchestrator.downloadPdf({
      analysisId: req.params.analysisId,
      userId: req.user._id,
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};
