import { body } from 'express-validator';
import { getPasswordErrorMessage } from '../utils/passwordValidator.js';

const newPasswordValidation = body('newPassword').custom((value) => {
  const message = getPasswordErrorMessage(value);
  if (message) {
    throw new Error(message);
  }
  return true;
});

const PROFILE_UPDATE_FIELDS = [
  'name',
  'email',
  'firstName',
  'lastName',
  'phone',
  'dateOfBirth',
  'gender',
  'country',
  'state',
  'city',
  'linkedin',
  'portfolio',
  'headline',
  'loginAlertsEnabled',
  'rememberDevicesEnabled',
  'languagePreference',
];

const optionalTrimmedString = (field, { max, allowEmpty = true } = {}) => {
  let chain = body(field)
    .optional({ values: 'null' })
    .customSanitizer((value) => (value === undefined || value === null ? value : String(value).trim()));

  if (allowEmpty) {
    chain = chain.custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (typeof value !== 'string') throw new Error(`${field} must be a string`);
      if (max && value.length > max) throw new Error(`${field} cannot exceed ${max} characters`);
      return true;
    });
  } else {
    chain = chain
      .notEmpty()
      .withMessage(`${field} cannot be empty`)
      .isLength({ max })
      .withMessage(`${field} cannot exceed ${max} characters`);
  }

  return chain;
};

const optionalUrlField = (field) =>
  body(field)
    .optional({ values: 'null' })
    .customSanitizer((value) => (value === undefined || value === null ? value : String(value).trim()))
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value.length > 500) throw new Error(`${field} cannot exceed 500 characters`);
      try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('invalid protocol');
        }
      } catch {
        throw new Error(`${field} must be a valid http(s) URL`);
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
  optionalTrimmedString('firstName', { max: 50 }),
  optionalTrimmedString('lastName', { max: 50 }),
  body('phone')
    .optional({ values: 'null' })
    .customSanitizer((value) => (value === undefined || value === null ? value : String(value).trim()))
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value.length > 30) throw new Error('Phone number cannot exceed 30 characters');
      if (!/^\+?[\d\s().-]{7,30}$/.test(value)) {
        throw new Error('Phone number format looks invalid');
      }
      return true;
    }),
  body('dateOfBirth')
    .optional({ values: 'null' })
    .customSanitizer((value) => {
      if (value === undefined || value === null) return value;
      const trimmed = String(value).trim();
      return trimmed === '' ? '' : trimmed;
    })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('Date of birth must be YYYY-MM-DD');
      }
      const date = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new Error('Date of birth is not a valid date');
      }
      const today = new Date();
      const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      if (date > todayUtc) {
        throw new Error('Date of birth cannot be in the future');
      }
      const min = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
      if (date < min) {
        throw new Error('Date of birth is out of range');
      }
      return true;
    }),
  optionalTrimmedString('gender', { max: 40 }),
  optionalTrimmedString('country', { max: 100 }),
  optionalTrimmedString('state', { max: 100 }),
  optionalTrimmedString('city', { max: 100 }),
  optionalUrlField('linkedin'),
  optionalUrlField('portfolio'),
  optionalTrimmedString('headline', { max: 200 }),
  body('loginAlertsEnabled')
    .optional()
    .isBoolean()
    .withMessage('loginAlertsEnabled must be a boolean'),
  body('rememberDevicesEnabled')
    .optional()
    .isBoolean()
    .withMessage('rememberDevicesEnabled must be a boolean'),
  body('languagePreference')
    .optional()
    .isIn(['en-US', 'en-GB', 'es', 'ur'])
    .withMessage('languagePreference must be a supported language code'),
  body().custom((_value, { req }) => {
    const hasField = PROFILE_UPDATE_FIELDS.some((field) => req.body[field] !== undefined);
    if (!hasField) {
      throw new Error('At least one profile field is required');
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
