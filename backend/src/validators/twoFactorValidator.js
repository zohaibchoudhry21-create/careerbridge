import { body } from 'express-validator';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';

export const twoFactorCodeValidation = body('code')
  .optional({ nullable: true })
  .trim()
  .matches(/^\d{6}$/)
  .withMessage(ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_FORMAT);

export const twoFactorBackupCodeValidation = body('backupCode')
  .optional({ nullable: true })
  .trim()
  .isLength({ min: 8, max: 12 })
  .withMessage(ERROR_CODES.VALIDATION.TWO_FACTOR_BACKUP_FORMAT);

export const confirmTwoFactorValidation = [
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage(ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_FORMAT),
];

export const verifyTwoFactorValidation = [
  twoFactorCodeValidation,
  twoFactorBackupCodeValidation,
  body().custom((_value, { req }) => {
    if (!req.body.code && !req.body.backupCode) {
      throw new Error(ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_REQUIRED);
    }
    return true;
  }),
];

export const disableTwoFactorValidation = [
  body('password').optional({ nullable: true }),
  twoFactorCodeValidation,
  twoFactorBackupCodeValidation,
  body().custom((_value, { req }) => {
    if (!req.body.code && !req.body.backupCode) {
      throw new Error(ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_REQUIRED);
    }
    return true;
  }),
];

export const regenerateBackupCodesValidation = [
  body('password').optional({ nullable: true }),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage(ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_FORMAT),
];
