import express from 'express';
import { getUserProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users/me/profile', protect, getUserProfile);

export default router;
