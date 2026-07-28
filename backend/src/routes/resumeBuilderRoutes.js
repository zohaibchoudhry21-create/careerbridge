import express from 'express';
import rateLimit from 'express-rate-limit';
import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';
import {
  deleteParsedResume,
  exportParsedResume,
  getParsedResume,
  getParsedResumeHistory,
  reprocessParsedResume,
  searchParsedResumes,
  updateParsedResume,
  uploadParsedResume,
} from '../controllers/parsedResumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleResumeUpload, handleUploadError } from '../middleware/resumeUploadMiddleware.js';

const router = express.Router();

const heavyResumeLimiter = rateLimit({
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
      code: ERROR_CODES.RATE_LIMIT.RESUME_HEAVY,
      params: {},
      message: getErrorMessage(ERROR_CODES.RATE_LIMIT.RESUME_HEAVY),
      retryAfterSeconds,
    });
  },
});

router.post(
  '/resume/upload',
  protect,
  heavyResumeLimiter,
  handleResumeUpload,
  handleUploadError,
  uploadParsedResume
);
router.get('/resume/history', protect, getParsedResumeHistory);
router.get('/resume/search/:query', protect, searchParsedResumes);
router.get('/resume/export/:id', protect, exportParsedResume);
router.post('/resume/:id/reprocess', protect, heavyResumeLimiter, reprocessParsedResume);
router.get('/resume/:id', protect, getParsedResume);
router.put('/resume/:id', protect, updateParsedResume);
router.delete('/resume/:id', protect, deleteParsedResume);

export default router;
