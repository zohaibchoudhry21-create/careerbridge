import express from 'express';
import rateLimit from 'express-rate-limit';
import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';
import { analyzeVoice } from '../controllers/voiceAnalysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleMockInterviewAudioUpload } from '../middleware/mockInterviewUploadMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { analyzeVoiceValidation } from '../validators/voiceAnalysisValidator.js';

const router = express.Router();

const voiceAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    let retryAfterSeconds = Math.max(1, Math.ceil((15 * 60 * 1000) / 1000));

    if (resetTime instanceof Date) {
      retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    }

    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: ERROR_CODES.RATE_LIMIT.VOICE_ANALYSIS,
      params: {},
      message: getErrorMessage(ERROR_CODES.RATE_LIMIT.VOICE_ANALYSIS),
      retryAfterSeconds,
    });
  },
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
