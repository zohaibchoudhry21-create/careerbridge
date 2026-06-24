import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  exchangeSocialCode,
} from '../controllers/authController.js';
import {
  getSocialAuthStatus,
  initiateSocialAuth,
  handleSocialAuthCallback,
  redirectFrontendSocialCallback,
} from '../controllers/socialAuthController.js';
import { resendVerificationEmail } from '../controllers/verifyEmailController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendVerificationValidation,
  socialCodeValidation,
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);
router.post('/social/exchange', socialCodeValidation, validateRequest, exchangeSocialCode);
router.get('/social/status', getSocialAuthStatus);
router.get('/social/callback', redirectFrontendSocialCallback);
router.get('/social/google', initiateSocialAuth('google'));
router.get('/social/facebook', initiateSocialAuth('facebook'));
router.get('/social/linkedin', initiateSocialAuth('linkedin'));
router.get('/social/google/callback', handleSocialAuthCallback('google'));
router.get('/social/facebook/callback', handleSocialAuthCallback('facebook'));
router.get('/social/linkedin/callback', handleSocialAuthCallback('linkedin'));
router.get('/google', initiateSocialAuth('google'));
router.get('/facebook', initiateSocialAuth('facebook'));
router.get('/linkedin', initiateSocialAuth('linkedin'));
router.get('/google/callback', handleSocialAuthCallback('google'));
router.get('/facebook/callback', handleSocialAuthCallback('facebook'));
router.get('/linkedin/callback', handleSocialAuthCallback('linkedin'));
router.post('/resend-verification', resendVerificationValidation, validateRequest, resendVerificationEmail);

export default router;
