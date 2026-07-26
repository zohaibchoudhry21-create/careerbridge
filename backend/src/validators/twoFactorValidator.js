import { body } from 'express-validator';

export const twoFactorCodeValidation = body('code')
  .optional({ nullable: true })
  .trim()
  .matches(/^\d{6}$/)
  .withMessage('Authentication code must be a 6-digit number');

export const twoFactorBackupCodeValidation = body('backupCode')
  .optional({ nullable: true })
  .trim()
  .isLength({ min: 8, max: 12 })
  .withMessage('Backup code format looks invalid');

export const confirmTwoFactorValidation = [
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Authentication code must be a 6-digit number'),
];

export const verifyTwoFactorValidation = [
  twoFactorCodeValidation,
  twoFactorBackupCodeValidation,
  body().custom((_value, { req }) => {
    if (!req.body.code && !req.body.backupCode) {
      throw new Error('Authentication code or backup code is required');
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
      throw new Error('Authentication code or backup code is required');
    }
    return true;
  }),
];

export const regenerateBackupCodesValidation = [
  body('password').optional({ nullable: true }),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Authentication code must be a 6-digit number'),
];
