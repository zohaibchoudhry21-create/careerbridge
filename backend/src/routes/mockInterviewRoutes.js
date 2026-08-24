import express from 'express';

import {
  generateMockInterviewReport,
  analyzeInterviewResume,
  getInterviewReportHistory,
  getInterviewSessionHistory,
  clearInterviewSessionHistory,
  deleteMockInterviewSession,
  getSavedInterviewReport,
  getMockInterviewSession,
  getRoleSuggestions,
  previewPanelSeats,
  startLiveInterview,
  submitLiveInterview,
  applyLiveAdaptiveDepth,
} from '../controllers/mockInterviewController.js';

import {
  interviewFlowLimiter,
  interviewHeavyLimiter,
} from '../middleware/interviewPrepRateLimiters.js';

import { protect } from '../middleware/authMiddleware.js';

import { handleInterviewContextUpload } from '../middleware/interviewContextUploadMiddleware.js';

import { validateRequest } from '../middleware/validateRequest.js';

import {
  adaptiveDepthValidation,
  panelPreviewSeatsValidation,
  roleSuggestionsValidation,
  sessionIdBodyValidation,
  sessionIdParamValidation,
  startLiveInterviewValidation,
  submitLiveInterviewValidation,
} from '../validators/mockInterviewValidator.js';

const router = express.Router();

router.post(
  '/interview/live/start',
  protect,
  interviewFlowLimiter,
  startLiveInterviewValidation,
  validateRequest,
  startLiveInterview
);

router.get(
  '/interview/panel/preview-seats',
  protect,
  interviewFlowLimiter,
  panelPreviewSeatsValidation,
  validateRequest,
  previewPanelSeats
);

router.post(
  '/interview/live/submit',
  protect,
  interviewHeavyLimiter,
  submitLiveInterviewValidation,
  validateRequest,
  submitLiveInterview
);

router.post(
  '/interview/live/adaptive-depth',
  protect,
  interviewFlowLimiter,
  adaptiveDepthValidation,
  validateRequest,
  applyLiveAdaptiveDepth
);

router.post(
  '/interview/resume/analyze',
  protect,
  interviewHeavyLimiter,
  handleInterviewContextUpload,
  analyzeInterviewResume
);

router.post(
  '/interview/role-suggestions',
  protect,
  interviewFlowLimiter,
  roleSuggestionsValidation,
  validateRequest,
  getRoleSuggestions
);

router.get(
  '/interview/sessions/history',
  protect,
  interviewFlowLimiter,
  getInterviewSessionHistory
);

router.delete(
  '/interview/sessions/history',
  protect,
  interviewFlowLimiter,
  clearInterviewSessionHistory
);

router.get(
  '/interview/session/:sessionId',
  protect,
  interviewFlowLimiter,
  sessionIdParamValidation,
  validateRequest,
  getMockInterviewSession
);

router.delete(
  '/interview/session/:sessionId',
  protect,
  interviewFlowLimiter,
  sessionIdParamValidation,
  validateRequest,
  deleteMockInterviewSession
);

router.get('/interview/reports/history', protect, interviewFlowLimiter, getInterviewReportHistory);

router.get(
  '/interview/report/:sessionId',
  protect,
  interviewFlowLimiter,
  sessionIdParamValidation,
  validateRequest,
  getSavedInterviewReport
);

router.post(
  '/interview/report',
  protect,
  interviewHeavyLimiter,
  sessionIdBodyValidation,
  validateRequest,
  generateMockInterviewReport
);

router.post(
  '/interview/report/regenerate',
  protect,
  interviewHeavyLimiter,
  sessionIdBodyValidation,
  validateRequest,
  generateMockInterviewReport
);

export default router;
