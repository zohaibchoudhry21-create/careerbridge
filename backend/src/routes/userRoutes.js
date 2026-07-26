import express from 'express';
import { updateAccount, changePassword, deleteAccount, deactivateAccount, exportUserData, updateLanguagePreference, updateThemePreference } from '../controllers/settingsController.js';
import {
  listSessions,
  revokeOtherSessionsHandler,
  revokeSession,
  updateSessionTrust,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  updateProfileValidation,
  updateLanguagePreferenceValidation,
  updateThemePreferenceValidation,
  changePasswordValidation,
  deleteAccountValidation,
} from '../validators/profileValidator.js';
import { updateSessionTrustValidation } from '../validators/sessionValidator.js';

const router = express.Router();

// Language preference route (registered before generic profile PATCH).
router.patch(
  '/users/me/language-preference',
  protect,
  updateLanguagePreferenceValidation,
  validateRequest,
  updateLanguagePreference
);
router.patch(
  '/users/me/theme-preference',
  protect,
  updateThemePreferenceValidation,
  validateRequest,
  updateThemePreference
);
router.patch('/users/me', protect, updateProfileValidation, validateRequest, updateAccount);
router.patch('/users/me/password', protect, changePasswordValidation, validateRequest, changePassword);
router.post('/users/me/deactivate', protect, deactivateAccount);
router.get('/users/me/export', protect, exportUserData);
router.delete('/users/me', protect, deleteAccountValidation, validateRequest, deleteAccount);
router.get('/users/me/sessions', protect, listSessions);
router.delete('/users/me/sessions/others', protect, revokeOtherSessionsHandler);
router.patch(
  '/users/me/sessions/:id/trust',
  protect,
  updateSessionTrustValidation,
  validateRequest,
  updateSessionTrust
);
router.delete('/users/me/sessions/:id', protect, revokeSession);

export default router;
