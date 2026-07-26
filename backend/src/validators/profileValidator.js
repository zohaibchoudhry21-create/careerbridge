import { body } from 'express-validator';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';
import { getPasswordErrorCode } from '../utils/passwordValidator.js';

const newPasswordValidation = body('newPassword').custom((value) => {
  const passwordError = getPasswordErrorCode(value);
  if (passwordError) {
    throw new Error(formatValidationCode(passwordError.code, passwordError.params));
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
      if (typeof value !== 'string') {
        throw new Error(
          formatValidationCode(ERROR_CODES.VALIDATION.FIELD_MUST_BE_STRING, { field })
        );
      }
      if (max && value.length > max) {
        throw new Error(
          formatValidationCode(ERROR_CODES.VALIDATION.FIELD_MAX_LENGTH, { field, max })
        );
      }
      return true;
    });
  } else {
    chain = chain
      .notEmpty()
      .withMessage(formatValidationCode(ERROR_CODES.VALIDATION.FIELD_EMPTY, { field }))
      .isLength({ max })
      .withMessage(formatValidationCode(ERROR_CODES.VALIDATION.FIELD_MAX_LENGTH, { field, max }));
  }

  return chain;
};

const optionalUrlField = (field) =>
  body(field)
    .optional({ values: 'null' })
    .customSanitizer((value) => (value === undefined || value === null ? value : String(value).trim()))
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value.length > 500) {
        throw new Error(
          formatValidationCode(ERROR_CODES.VALIDATION.URL_TOO_LONG, { field })
        );
      }
      try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error(
            formatValidationCode(ERROR_CODES.VALIDATION.URL_INVALID, { field })
          );
        }
      } catch {
        throw new Error(formatValidationCode(ERROR_CODES.VALIDATION.URL_INVALID, { field }));
      }
      return true;
    });

export const updateLanguagePreferenceValidation = [
  body('languagePreference')
    .notEmpty()
    .withMessage(ERROR_CODES.VALIDATION.LANGUAGE_REQUIRED)
    .isIn(['en-US', 'en-GB', 'es', 'ur'])
    .withMessage(ERROR_CODES.VALIDATION.LANGUAGE_UNSUPPORTED),
];

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.VALIDATION.NAME_EMPTY)
    .isLength({ max: 100 })
    .withMessage(ERROR_CODES.VALIDATION.NAME_TOO_LONG),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage(ERROR_CODES.VALIDATION.EMAIL_INVALID)
    .normalizeEmail(),
  optionalTrimmedString('firstName', { max: 50 }),
  optionalTrimmedString('lastName', { max: 50 }),
  body('phone')
    .optional({ values: 'null' })
    .customSanitizer((value) => (value === undefined || value === null ? value : String(value).trim()))
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (value.length > 30) {
        throw new Error(ERROR_CODES.VALIDATION.PHONE_TOO_LONG);
      }
      if (!/^\+?[\d\s().-]{7,30}$/.test(value)) {
        throw new Error(ERROR_CODES.VALIDATION.PHONE_INVALID);
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
        throw new Error(ERROR_CODES.VALIDATION.DATE_FORMAT);
      }
      const date = new Date(`${value}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new Error(ERROR_CODES.VALIDATION.DATE_INVALID);
      }
      const today = new Date();
      const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      if (date > todayUtc) {
        throw new Error(ERROR_CODES.VALIDATION.DATE_FUTURE);
      }
      const min = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
      if (date < min) {
        throw new Error(ERROR_CODES.VALIDATION.DATE_OUT_OF_RANGE);
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
    .withMessage(
      formatValidationCode(ERROR_CODES.VALIDATION.BOOLEAN_REQUIRED, {
        field: 'loginAlertsEnabled',
      })
    ),
  body('rememberDevicesEnabled')
    .optional()
    .isBoolean()
    .withMessage(
      formatValidationCode(ERROR_CODES.VALIDATION.BOOLEAN_REQUIRED, {
        field: 'rememberDevicesEnabled',
      })
    ),
  body('languagePreference')
    .optional()
    .isIn(['en-US', 'en-GB', 'es', 'ur'])
    .withMessage(ERROR_CODES.VALIDATION.LANGUAGE_UNSUPPORTED),
  body().custom((_value, { req }) => {
    const hasField = PROFILE_UPDATE_FIELDS.some((field) => req.body[field] !== undefined);
    const hasLanguageOnly =
      req.body.languagePreference !== undefined &&
      Object.keys(req.body).every((key) => key === 'languagePreference');
    if (!hasField && !hasLanguageOnly) {
      throw new Error(ERROR_CODES.VALIDATION.PROFILE_FIELD_REQUIRED);
    }
    return true;
  }),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage(ERROR_CODES.PASSWORD.CURRENT_REQUIRED),
  newPasswordValidation,
  body('confirmPassword')
    .notEmpty()
    .withMessage(ERROR_CODES.PASSWORD.CONFIRM_REQUIRED)
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error(ERROR_CODES.PASSWORD.CONFIRM_MISMATCH);
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
    .withMessage(ERROR_CODES.VALIDATION.EMAIL_INVALID),
  body('confirmPhrase')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 64 })
    .withMessage(ERROR_CODES.VALIDATION.CONFIRM_PHRASE_TOO_LONG),
];
