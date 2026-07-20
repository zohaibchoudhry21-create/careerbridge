import express from 'express';
import rateLimit from 'express-rate-limit';
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
  message: {
    success: false,
    message: 'Too many resume AI/import requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
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
