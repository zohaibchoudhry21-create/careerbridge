import express from 'express';
import { getDashboard, getJobMatchesHandler } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboard);
router.get('/jobs/matches', protect, getJobMatchesHandler);

export default router;
