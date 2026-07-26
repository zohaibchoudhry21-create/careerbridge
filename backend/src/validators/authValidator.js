import { body } from 'express-validator';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';
import { getPasswordErrorCode } from '../utils/passwordValidator.js';

const passwordFieldValidation = body('password').custom((value) => {
  const passwordError = getPasswordErrorCode(value);
  if (passwordError) {
    throw new Error(formatValidationCode(passwordError.code, passwordError.params));
  }
  return true;
});

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.VALIDATION.NAME_REQUIRED)
    .isLength({ max: 100 }),
  body('email')
    .trim()
    .isEmail()
    .withMessage(ERROR_CODES.VALIDATION.EMAIL_REQUIRED)
    .normalizeEmail(),
  passwordFieldValidation,
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage(ERROR_CODES.VALIDATION.EMAIL_REQUIRED)
    .normalizeEmail(),
  body('password').notEmpty().withMessage(ERROR_CODES.PASSWORD.REQUIRED),
  body('trustDevice')
    .optional()
    .isBoolean()
    .withMessage(ERROR_CODES.VALIDATION.TRUST_DEVICE_BOOLEAN),
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage(ERROR_CODES.VALIDATION.EMAIL_REQUIRED)
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token').notEmpty().withMessage(ERROR_CODES.VALIDATION.RESET_TOKEN_REQUIRED),
  passwordFieldValidation,
];

export const resendVerificationValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage(ERROR_CODES.VALIDATION.EMAIL_REQUIRED)
    .normalizeEmail(),
];

export const socialCodeValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.VALIDATION.AUTH_CODE_REQUIRED)
    .isLength({ min: 64, max: 64 })
    .withMessage(ERROR_CODES.VALIDATION.AUTH_CODE_LENGTH),
];
