import express from 'express';
import {
  generateSkillQuiz,
  getSkillQuiz,
  listSkillTopics,
  submitSkillQuiz,
} from '../controllers/skillQuizController.js';
import {
  skillQuizGenerateLimiter,
  skillQuizSubmitLimiter,
} from '../middleware/interviewPrepRateLimiters.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  generateQuizValidation,
  quizIdParamValidation,
  submitQuizValidation,
} from '../validators/skillQuizValidator.js';

const router = express.Router();

router.get('/skills/topics', protect, listSkillTopics);
router.post(
  '/skills/generate-quiz',
  protect,
  skillQuizGenerateLimiter,
  generateQuizValidation,
  validateRequest,
  generateSkillQuiz
);
router.get(
  '/skills/quiz/:quizId',
  protect,
  quizIdParamValidation,
  validateRequest,
  getSkillQuiz
);
router.post(
  '/skills/submit-quiz',
  protect,
  skillQuizSubmitLimiter,
  submitQuizValidation,
  validateRequest,
  submitSkillQuiz
);

export default router;