import express from 'express';

import {
  generateMockInterviewReport,
  getMockInterviewSession,
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

import { validateRequest } from '../middleware/validateRequest.js';

import {
  nextMockQuestionValidation,
  sessionIdBodyValidation,
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
  startMockInterviewValidation,
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

router.get('/interview/session/:sessionId', protect, getMockInterviewSession);

router.post(
  '/interview/report',
  protect,
  interviewHeavyLimiter,
  sessionIdBodyValidation,
  validateRequest,
  generateMockInterviewReport
);

export default router;
