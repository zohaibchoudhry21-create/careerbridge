import express from 'express';
import rateLimit from 'express-rate-limit';
import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';
import {
  createBuiltResume,
  getBuiltResume,
  importBuiltResume,
  listBuiltResumes,
  resumeAiAction,
  suggestResumeSkills,
  updateBuiltResume,
} from '../controllers/resumeBuilderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleResumeImportUpload } from '../middleware/resumeImportUploadMiddleware.js';

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

router.get('/resumes', protect, listBuiltResumes);
router.post('/resumes', protect, createBuiltResume);
router.post(
  '/resumes/import',
  protect,
  heavyResumeLimiter,
  handleResumeImportUpload,
  importBuiltResume
);
router.post('/resumes/ai', protect, heavyResumeLimiter, resumeAiAction);
router.post('/resumes/suggest-skills', protect, heavyResumeLimiter, suggestResumeSkills);
router.get('/resumes/:resumeId', protect, getBuiltResume);
router.put('/resumes/:resumeId', protect, updateBuiltResume);

export default router;
