import express from 'express';

import {
  generateMockInterviewReport,
  analyzeInterviewResume,
  getInterviewReportHistory,
  getMockInterviewSession,
  getRoleSuggestions,
  startLiveInterview,
  submitLiveInterview,
} from '../controllers/mockInterviewController.js';

import {
  interviewFlowLimiter,
  interviewHeavyLimiter,
} from '../middleware/interviewPrepRateLimiters.js';

import { protect } from '../middleware/authMiddleware.js';

import { handleInterviewContextUpload } from '../middleware/interviewContextUploadMiddleware.js';

import { validateRequest } from '../middleware/validateRequest.js';

import {
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

router.post(
  '/interview/live/submit',
  protect,
  interviewHeavyLimiter,
  submitLiveInterviewValidation,
  validateRequest,
  submitLiveInterview
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
  '/interview/session/:sessionId',
  protect,
  interviewFlowLimiter,
  sessionIdParamValidation,
  validateRequest,
  getMockInterviewSession
);

router.get('/interview/reports/history', protect, interviewFlowLimiter, getInterviewReportHistory);

router.post(
  '/interview/report',
  protect,
  interviewHeavyLimiter,
  sessionIdBodyValidation,
  validateRequest,
  generateMockInterviewReport
);

export default router;
