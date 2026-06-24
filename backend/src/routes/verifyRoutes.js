import express from 'express';
import { verifyEmail } from '../controllers/verifyEmailController.js';

const router = express.Router();

router.get('/verify-email', verifyEmail);

export default router;
