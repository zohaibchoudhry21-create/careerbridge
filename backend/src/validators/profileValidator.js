import { body } from 'express-validator';
import { getPasswordErrorMessage } from '../utils/passwordValidator.js';

const newPasswordValidation = body('newPassword').custom((value) => {
  const message = getPasswordErrorMessage(value);
  if (message) {
    throw new Error(message);
  }
  return true;
});

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email').optional().trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body().custom((_value, { req }) => {
    if (req.body.name === undefined && req.body.email === undefined) {
      throw new Error('At least one field (name or email) is required');
    }
    return true;
  }),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  newPasswordValidation,
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
];

export const deleteAccountValidation = [
  body('password').optional({ nullable: true }),
  body('confirmEmail')
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('confirmPhrase')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 64 })
    .withMessage('Confirmation phrase is too long'),
];
