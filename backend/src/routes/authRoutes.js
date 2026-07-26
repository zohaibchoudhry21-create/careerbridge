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
  clearChallenge,
  confirm,
  disable,
  getStatus,
  regenerateBackupCodesHandler,
  setup,
  verifyLogin,
} from '../controllers/twoFactorController.js';
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
import {
  confirmTwoFactorValidation,
  disableTwoFactorValidation,
  regenerateBackupCodesValidation,
  verifyTwoFactorValidation,
} from '../validators/twoFactorValidator.js';

const router = express.Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/2fa/verify', verifyTwoFactorValidation, validateRequest, verifyLogin);
router.post('/2fa/clear-challenge', clearChallenge);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.get('/2fa/status', protect, getStatus);
router.post('/2fa/setup', protect, setup);
router.post('/2fa/confirm', protect, confirmTwoFactorValidation, validateRequest, confirm);
router.post('/2fa/disable', protect, disableTwoFactorValidation, validateRequest, disable);
router.post(
  '/2fa/backup-codes/regenerate',
  protect,
  regenerateBackupCodesValidation,
  validateRequest,
  regenerateBackupCodesHandler
);
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
