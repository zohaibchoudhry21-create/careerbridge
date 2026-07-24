import express from 'express';

import {
  generateMockInterviewReport,
  analyzeInterviewResume,
  extractInterviewContextText,
  getInterviewReportHistory,
  getMockInterviewSession,
  getRoleSuggestions,
  nextMockInterviewQuestion,
  startLiveInterview,
  startMockInterview,
  startVoiceCallInterview,
  submitLiveInterview,
  submitMockInterviewAnswer,
  submitVoiceCallTranscript,
} from '../controllers/mockInterviewController.js';

import {
  interviewFlowLimiter,
  interviewHeavyLimiter,
} from '../middleware/interviewPrepRateLimiters.js';

import { protect } from '../middleware/authMiddleware.js';

import { handleMockInterviewAudioUpload } from '../middleware/mockInterviewUploadMiddleware.js';
import { handleInterviewContextUpload } from '../middleware/interviewContextUploadMiddleware.js';

import { validateRequest } from '../middleware/validateRequest.js';

import {
  nextMockQuestionValidation,
  roleSuggestionsValidation,
  sessionIdBodyValidation,
  startLiveInterviewValidation,
  startMockInterviewValidation,
  submitLiveInterviewValidation,
  submitMockAnswerValidation,
  submitVoiceCallTranscriptValidation,
} from '../validators/mockInterviewValidator.js';

const router = express.Router();

router.post(
  '/interview/start',
  protect,
  interviewFlowLimiter,
  startMockInterviewValidation,
  validateRequest,
  startMockInterview
);

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
  '/interview/voice-call/start',
  protect,
  interviewFlowLimiter,
  startMockInterviewValidation,
  validateRequest,
  startVoiceCallInterview
);

router.post(
  '/interview/submit-answer',
  protect,
  interviewFlowLimiter,
  handleMockInterviewAudioUpload,
  submitMockAnswerValidation,
  validateRequest,
  submitMockInterviewAnswer
);

router.post(
  '/interview/voice-call/submit-transcript',
  protect,
  interviewHeavyLimiter,
  submitVoiceCallTranscriptValidation,
  validateRequest,
  submitVoiceCallTranscript
);

router.post(
  '/interview/next-question',
  protect,
  interviewFlowLimiter,
  nextMockQuestionValidation,
  validateRequest,
  nextMockInterviewQuestion
);

router.post(
  '/interview/context/extract-text',
  protect,
  interviewFlowLimiter,
  handleInterviewContextUpload,
  extractInterviewContextText
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

router.get('/interview/session/:sessionId', protect, getMockInterviewSession);

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
