import express from 'express';
import { updateAccount, changePassword, deleteAccount } from '../controllers/settingsController.js';
import {
  listSessions,
  revokeOtherSessionsHandler,
  revokeSession,
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  updateProfileValidation,
  changePasswordValidation,
  deleteAccountValidation,
} from '../validators/profileValidator.js';

const router = express.Router();

router.patch('/users/me', protect, updateProfileValidation, validateRequest, updateAccount);
router.patch('/users/me/password', protect, changePasswordValidation, validateRequest, changePassword);
router.delete('/users/me', protect, deleteAccountValidation, validateRequest, deleteAccount);
router.get('/users/me/sessions', protect, listSessions);
router.delete('/users/me/sessions/others', protect, revokeOtherSessionsHandler);
router.delete('/users/me/sessions/:id', protect, revokeSession);

export default router;
