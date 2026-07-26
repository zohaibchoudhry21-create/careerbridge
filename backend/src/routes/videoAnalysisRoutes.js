import express from 'express';
import { analyzeVideoFrames } from '../controllers/videoAnalysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { analyzeVideoValidation } from '../validators/videoAnalysisValidator.js';

const router = express.Router();

router.post(
  '/analysis/video',
  protect,
  analyzeVideoValidation,
  validateRequest,
  analyzeVideoFrames
);

export default router;
