import express from 'express';
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

router.get('/resumes', protect, listBuiltResumes);
router.post('/resumes', protect, createBuiltResume);
router.post('/resumes/import', protect, handleResumeImportUpload, importBuiltResume);
router.post('/resumes/ai', protect, resumeAiAction);
router.post('/resumes/suggest-skills', protect, suggestResumeSkills);
router.get('/resumes/:resumeId', protect, getBuiltResume);
router.put('/resumes/:resumeId', protect, updateBuiltResume);

export default router;
