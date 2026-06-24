import express from 'express';
import {
  getSocialAuthStatus,
  handleSocialAuthCallback,
  initiateSocialAuth,
  redirectFrontendSocialCallback,
} from '../controllers/socialAuthController.js';

const router = express.Router();

router.get('/status', getSocialAuthStatus);
router.get('/social/callback', redirectFrontendSocialCallback);

router.get('/social/google', initiateSocialAuth('google'));
router.get('/social/facebook', initiateSocialAuth('facebook'));
router.get('/social/linkedin', initiateSocialAuth('linkedin'));
router.get('/social/google/callback', handleSocialAuthCallback('google'));
router.get('/social/facebook/callback', handleSocialAuthCallback('facebook'));
router.get('/social/linkedin/callback', handleSocialAuthCallback('linkedin'));

router.get('/google', initiateSocialAuth('google'));
router.get('/google/callback', handleSocialAuthCallback('google'));

router.get('/facebook', initiateSocialAuth('facebook'));
router.get('/facebook/callback', handleSocialAuthCallback('facebook'));

router.get('/linkedin', initiateSocialAuth('linkedin'));
router.get('/linkedin/callback', handleSocialAuthCallback('linkedin'));

export default router;
