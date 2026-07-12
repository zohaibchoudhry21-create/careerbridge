import express from 'express';
import { updateAccount, changePassword, deleteAccount } from '../controllers/settingsController.js';
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

export default router;
