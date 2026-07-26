import { body } from 'express-validator';
import { getPasswordErrorMessage } from '../utils/passwordValidator.js';

const passwordFieldValidation = body('password').custom((value) => {
  const message = getPasswordErrorMessage(value);
  if (message) {
    throw new Error(message);
  }
  return true;
});

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordFieldValidation,
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('trustDevice').optional().isBoolean().withMessage('trustDevice must be a boolean'),
];

export const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  passwordFieldValidation,
];

export const resendVerificationValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const socialCodeValidation = [
  body('code').trim().notEmpty().withMessage('Authorization code is required').isLength({ min: 64, max: 64 }),
];
