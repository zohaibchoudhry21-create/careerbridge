import express from 'express';
import rateLimit from 'express-rate-limit';
import { analyzeVoice } from '../controllers/voiceAnalysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleMockInterviewAudioUpload } from '../middleware/mockInterviewUploadMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { analyzeVoiceValidation } from '../validators/voiceAnalysisValidator.js';

const router = express.Router();

const voiceAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many voice analysis requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/analysis/voice',
  protect,
  voiceAnalysisLimiter,
  handleMockInterviewAudioUpload,
  analyzeVoiceValidation,
  validateRequest,
  analyzeVoice
);

export default router;
