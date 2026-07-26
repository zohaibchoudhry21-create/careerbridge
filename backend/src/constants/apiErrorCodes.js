/** @typedef {Record<string, string | number>} ApiErrorParams */

export const ACCOUNT_DELETE_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

export const ERROR_CODES = {
  AUTH: {
    INVALID_CREDENTIALS: 'AUTH.INVALID_CREDENTIALS',
    EMAIL_NOT_VERIFIED: 'AUTH.EMAIL_NOT_VERIFIED',
    EMAIL_ALREADY_REGISTERED: 'AUTH.EMAIL_ALREADY_REGISTERED',
    EMAIL_ALREADY_REGISTERED_LOGIN: 'AUTH.EMAIL_ALREADY_REGISTERED_LOGIN',
    ACCOUNT_NOT_ACTIVE: 'AUTH.ACCOUNT_NOT_ACTIVE',
    ACCOUNT_NOT_ACTIVE_SUPPORT: 'AUTH.ACCOUNT_NOT_ACTIVE_SUPPORT',
    RESET_TOKEN_INVALID: 'AUTH.RESET_TOKEN_INVALID',
    AUTH_CODE_INVALID: 'AUTH.AUTH_CODE_INVALID',
    NOT_AUTHORIZED: 'AUTH.NOT_AUTHORIZED',
    SESSION_EXPIRED: 'AUTH.SESSION_EXPIRED',
    TOKEN_INVALID: 'AUTH.TOKEN_INVALID',
    AUTH_NOT_CONFIGURED: 'AUTH.AUTH_NOT_CONFIGURED',
    OAUTH_REAUTH_REQUIRED: 'AUTH.OAUTH_REAUTH_REQUIRED',
  },
  VERIFY: {
    TOKEN_REQUIRED: 'VERIFY.TOKEN_REQUIRED',
    TOKEN_INVALID: 'VERIFY.TOKEN_INVALID',
    EMAIL_ALREADY_VERIFIED: 'VERIFY.EMAIL_ALREADY_VERIFIED',
  },
  SOCIAL: {
    PROVIDER_NO_USER_ID: 'SOCIAL.PROVIDER_NO_USER_ID',
    EMAIL_PERMISSION_REQUIRED: 'SOCIAL.EMAIL_PERMISSION_REQUIRED',
    EMAIL_EXISTS_LOCAL: 'SOCIAL.EMAIL_EXISTS_LOCAL',
    EMAIL_PROVIDER_MISMATCH: 'SOCIAL.EMAIL_PROVIDER_MISMATCH',
    EMAIL_ALREADY_REGISTERED: 'SOCIAL.EMAIL_ALREADY_REGISTERED',
    AUTH_FAILED: 'SOCIAL.AUTH_FAILED',
    PROVIDER_NOT_CONFIGURED: 'SOCIAL.PROVIDER_NOT_CONFIGURED',
    SIGN_IN_FAILED: 'SOCIAL.SIGN_IN_FAILED',
  },
  REACTIVATION: {
    SESSION_EXPIRED: 'REACTIVATION.SESSION_EXPIRED',
    NOT_DEACTIVATED: 'REACTIVATION.NOT_DEACTIVATED',
  },
  TWO_FACTOR: {
    ALREADY_ENABLED: 'TWO_FACTOR.ALREADY_ENABLED',
    NOT_ENABLED: 'TWO_FACTOR.NOT_ENABLED',
    NOT_ENABLED_FOR_ACCOUNT: 'TWO_FACTOR.NOT_ENABLED_FOR_ACCOUNT',
    SETUP_REQUIRED: 'TWO_FACTOR.SETUP_REQUIRED',
    INVALID_CODE: 'TWO_FACTOR.INVALID_CODE',
    CHALLENGE_EXPIRED: 'TWO_FACTOR.CHALLENGE_EXPIRED',
    TOO_MANY_ATTEMPTS: 'TWO_FACTOR.TOO_MANY_ATTEMPTS',
    PASSWORD_REQUIRED_DISABLE: 'TWO_FACTOR.PASSWORD_REQUIRED_DISABLE',
    PASSWORD_REQUIRED_REGEN: 'TWO_FACTOR.PASSWORD_REQUIRED_REGEN',
    PASSWORD_INCORRECT: 'TWO_FACTOR.PASSWORD_INCORRECT',
    CODE_OR_BACKUP_REQUIRED: 'TWO_FACTOR.CODE_OR_BACKUP_REQUIRED',
    OAUTH_REAUTH_REQUIRED: 'TWO_FACTOR.OAUTH_REAUTH_REQUIRED',
  },
  PASSWORD: {
    REQUIRED: 'PASSWORD.REQUIRED',
    POLICY_VIOLATION: 'PASSWORD.POLICY_VIOLATION',
    TOO_COMMON: 'PASSWORD.TOO_COMMON',
    CURRENT_REQUIRED: 'PASSWORD.CURRENT_REQUIRED',
    CONFIRM_REQUIRED: 'PASSWORD.CONFIRM_REQUIRED',
    CONFIRM_MISMATCH: 'PASSWORD.CONFIRM_MISMATCH',
    CURRENT_INCORRECT: 'PASSWORD.CURRENT_INCORRECT',
    SAME_AS_CURRENT: 'PASSWORD.SAME_AS_CURRENT',
    CHANGE_NOT_AVAILABLE: 'PASSWORD.CHANGE_NOT_AVAILABLE',
  },
  VALIDATION: {
    NAME_REQUIRED: 'VALIDATION.NAME_REQUIRED',
    EMAIL_REQUIRED: 'VALIDATION.EMAIL_REQUIRED',
    EMAIL_INVALID: 'VALIDATION.EMAIL_INVALID',
    RESET_TOKEN_REQUIRED: 'VALIDATION.RESET_TOKEN_REQUIRED',
    AUTH_CODE_REQUIRED: 'VALIDATION.AUTH_CODE_REQUIRED',
    AUTH_CODE_LENGTH: 'VALIDATION.AUTH_CODE_LENGTH',
    TRUST_DEVICE_BOOLEAN: 'VALIDATION.TRUST_DEVICE_BOOLEAN',
    LANGUAGE_REQUIRED: 'VALIDATION.LANGUAGE_REQUIRED',
    LANGUAGE_UNSUPPORTED: 'VALIDATION.LANGUAGE_UNSUPPORTED',
    NAME_EMPTY: 'VALIDATION.NAME_EMPTY',
    NAME_TOO_LONG: 'VALIDATION.NAME_TOO_LONG',
    FIELD_MUST_BE_STRING: 'VALIDATION.FIELD_MUST_BE_STRING',
    FIELD_MAX_LENGTH: 'VALIDATION.FIELD_MAX_LENGTH',
    FIELD_EMPTY: 'VALIDATION.FIELD_EMPTY',
    PHONE_TOO_LONG: 'VALIDATION.PHONE_TOO_LONG',
    PHONE_INVALID: 'VALIDATION.PHONE_INVALID',
    DATE_FORMAT: 'VALIDATION.DATE_FORMAT',
    DATE_INVALID: 'VALIDATION.DATE_INVALID',
    DATE_FUTURE: 'VALIDATION.DATE_FUTURE',
    DATE_OUT_OF_RANGE: 'VALIDATION.DATE_OUT_OF_RANGE',
    URL_TOO_LONG: 'VALIDATION.URL_TOO_LONG',
    URL_INVALID: 'VALIDATION.URL_INVALID',
    BOOLEAN_REQUIRED: 'VALIDATION.BOOLEAN_REQUIRED',
    PROFILE_FIELD_REQUIRED: 'VALIDATION.PROFILE_FIELD_REQUIRED',
    CONFIRM_PHRASE_TOO_LONG: 'VALIDATION.CONFIRM_PHRASE_TOO_LONG',
    SESSION_ID_INVALID: 'VALIDATION.SESSION_ID_INVALID',
    TRUSTED_BOOLEAN: 'VALIDATION.TRUSTED_BOOLEAN',
    TWO_FACTOR_CODE_FORMAT: 'VALIDATION.TWO_FACTOR_CODE_FORMAT',
    TWO_FACTOR_BACKUP_FORMAT: 'VALIDATION.TWO_FACTOR_BACKUP_FORMAT',
    TWO_FACTOR_CODE_REQUIRED: 'VALIDATION.TWO_FACTOR_CODE_REQUIRED',
    INVALID_FIELD: 'VALIDATION.INVALID_FIELD',
    GENERIC: 'VALIDATION.GENERIC',
  },
  ACCOUNT: {
    USER_NOT_FOUND: 'ACCOUNT.USER_NOT_FOUND',
    NAME_EMPTY: 'ACCOUNT.NAME_EMPTY',
    EMAIL_ALREADY_REGISTERED: 'ACCOUNT.EMAIL_ALREADY_REGISTERED',
    DELETE_PASSWORD_REQUIRED: 'ACCOUNT.DELETE_PASSWORD_REQUIRED',
    DELETE_PASSWORD_INCORRECT: 'ACCOUNT.DELETE_PASSWORD_INCORRECT',
    DELETE_EMAIL_MISMATCH: 'ACCOUNT.DELETE_EMAIL_MISMATCH',
    DELETE_PHRASE_REQUIRED: 'ACCOUNT.DELETE_PHRASE_REQUIRED',
    DELETE_OAUTH_REAUTH: 'ACCOUNT.DELETE_OAUTH_REAUTH',
    ALREADY_DEACTIVATED: 'ACCOUNT.ALREADY_DEACTIVATED',
    EXPORT_COOLDOWN: 'ACCOUNT.EXPORT_COOLDOWN',
  },
  SESSION: {
    NOT_FOUND: 'SESSION.NOT_FOUND',
    CURRENT_NOT_IDENTIFIED: 'SESSION.CURRENT_NOT_IDENTIFIED',
    TRUST_LIMIT_REACHED: 'SESSION.TRUST_LIMIT_REACHED',
    REMEMBER_DEVICES_REQUIRED: 'SESSION.REMEMBER_DEVICES_REQUIRED',
  },
  COMMON: {
    ROUTE_NOT_FOUND: 'COMMON.ROUTE_NOT_FOUND',
    INTERNAL_ERROR: 'COMMON.INTERNAL_ERROR',
    PAYLOAD_TOO_LARGE: 'COMMON.PAYLOAD_TOO_LARGE',
    FILE_TOO_LARGE: 'COMMON.FILE_TOO_LARGE',
    FILE_UPLOAD_FAILED: 'COMMON.FILE_UPLOAD_FAILED',
    DUPLICATE_EMAIL: 'COMMON.DUPLICATE_EMAIL',
    UNKNOWN: 'COMMON.UNKNOWN',
  },
  RATE_LIMIT: {
    AUTH: 'RATE_LIMIT.AUTH',
    SOCIAL_AUTH: 'RATE_LIMIT.SOCIAL_AUTH',
  },
};

/** Transitional English fallbacks (also used when frontend misses a code). */
export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.AUTH.EMAIL_NOT_VERIFIED]:
    'Please verify your email before logging in. Check your inbox for the verification link.',
  [ERROR_CODES.AUTH.EMAIL_ALREADY_REGISTERED]: 'Email already registered. Please log in instead.',
  [ERROR_CODES.AUTH.EMAIL_ALREADY_REGISTERED_LOGIN]:
    'Email already registered. Please use another email or log in.',
  [ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE]: 'Account is not active.',
  [ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE_SUPPORT]:
    'Account is not active. Please contact support.',
  [ERROR_CODES.AUTH.RESET_TOKEN_INVALID]: 'Invalid or expired reset token',
  [ERROR_CODES.AUTH.AUTH_CODE_INVALID]: 'Invalid or expired authorization code',
  [ERROR_CODES.AUTH.NOT_AUTHORIZED]: 'Not authorized. Please log in.',
  [ERROR_CODES.AUTH.SESSION_EXPIRED]: 'Session expired. Please log in again.',
  [ERROR_CODES.AUTH.TOKEN_INVALID]: 'Invalid or expired token. Please log in again.',
  [ERROR_CODES.AUTH.AUTH_NOT_CONFIGURED]: 'Authentication is not configured.',
  [ERROR_CODES.AUTH.OAUTH_REAUTH_REQUIRED]:
    'For security, sign out and sign in again with {{provider}}, then try again within {{minutes}} minutes.',

  [ERROR_CODES.VERIFY.TOKEN_REQUIRED]: 'Verification token is required',
  [ERROR_CODES.VERIFY.TOKEN_INVALID]: 'Invalid or expired token',
  [ERROR_CODES.VERIFY.EMAIL_ALREADY_VERIFIED]: 'This email is already verified. Please log in.',

  [ERROR_CODES.SOCIAL.PROVIDER_NO_USER_ID]: 'Social provider did not return a user ID.',
  [ERROR_CODES.SOCIAL.EMAIL_PERMISSION_REQUIRED]:
    'Email permission is required to sign in with this provider.',
  [ERROR_CODES.SOCIAL.EMAIL_EXISTS_LOCAL]:
    'An account with this email already exists. Please log in with your email and password.',
  [ERROR_CODES.SOCIAL.EMAIL_PROVIDER_MISMATCH]:
    'This email is already linked to a different sign-in provider.',
  [ERROR_CODES.SOCIAL.EMAIL_ALREADY_REGISTERED]:
    'This email is already registered. Please use the original sign-in method for this account.',
  [ERROR_CODES.SOCIAL.AUTH_FAILED]: 'Authentication failed. Please try again.',
  [ERROR_CODES.SOCIAL.PROVIDER_NOT_CONFIGURED]: '{{provider}} login is not configured on the server.',
  [ERROR_CODES.SOCIAL.SIGN_IN_FAILED]: 'Unable to complete sign in. Please try again.',

  [ERROR_CODES.REACTIVATION.SESSION_EXPIRED]: 'Reactivation session expired. Please sign in again.',
  [ERROR_CODES.REACTIVATION.NOT_DEACTIVATED]: 'This account is not deactivated.',

  [ERROR_CODES.TWO_FACTOR.ALREADY_ENABLED]: 'Two-factor authentication is already enabled.',
  [ERROR_CODES.TWO_FACTOR.NOT_ENABLED]: 'Two-factor authentication is not enabled.',
  [ERROR_CODES.TWO_FACTOR.NOT_ENABLED_FOR_ACCOUNT]:
    'Two-factor authentication is not enabled for this account.',
  [ERROR_CODES.TWO_FACTOR.SETUP_REQUIRED]: 'Start two-factor setup before confirming a code.',
  [ERROR_CODES.TWO_FACTOR.INVALID_CODE]: 'Invalid authentication code. Please try again.',
  [ERROR_CODES.TWO_FACTOR.CHALLENGE_EXPIRED]: 'Two-factor challenge expired. Please sign in again.',
  [ERROR_CODES.TWO_FACTOR.TOO_MANY_ATTEMPTS]: 'Too many invalid codes. Please sign in again.',
  [ERROR_CODES.TWO_FACTOR.PASSWORD_REQUIRED_DISABLE]:
    'Password confirmation is required to disable two-factor authentication.',
  [ERROR_CODES.TWO_FACTOR.PASSWORD_REQUIRED_REGEN]:
    'Password confirmation is required to regenerate backup codes.',
  [ERROR_CODES.TWO_FACTOR.PASSWORD_INCORRECT]: 'Password confirmation is incorrect.',
  [ERROR_CODES.TWO_FACTOR.CODE_OR_BACKUP_REQUIRED]:
    'A valid authentication or backup code is required.',
  [ERROR_CODES.TWO_FACTOR.OAUTH_REAUTH_REQUIRED]:
    'For security, sign out and sign in again with your provider, then try again within {{minutes}} minutes.',

  [ERROR_CODES.PASSWORD.REQUIRED]: 'Password is required',
  [ERROR_CODES.PASSWORD.POLICY_VIOLATION]: 'Password does not meet requirements',
  [ERROR_CODES.PASSWORD.TOO_COMMON]: 'Password is too common. Choose a stronger password',
  [ERROR_CODES.PASSWORD.CURRENT_REQUIRED]: 'Current password is required',
  [ERROR_CODES.PASSWORD.CONFIRM_REQUIRED]: 'Password confirmation is required',
  [ERROR_CODES.PASSWORD.CONFIRM_MISMATCH]: 'Password confirmation does not match',
  [ERROR_CODES.PASSWORD.CURRENT_INCORRECT]: 'Current password is incorrect.',
  [ERROR_CODES.PASSWORD.SAME_AS_CURRENT]:
    'New password must be different from your current password.',
  [ERROR_CODES.PASSWORD.CHANGE_NOT_AVAILABLE]:
    'Password changes are only available for email and password accounts.',

  [ERROR_CODES.VALIDATION.NAME_REQUIRED]: 'Name is required',
  [ERROR_CODES.VALIDATION.EMAIL_REQUIRED]: 'Valid email is required',
  [ERROR_CODES.VALIDATION.EMAIL_INVALID]: 'Valid email is required',
  [ERROR_CODES.VALIDATION.RESET_TOKEN_REQUIRED]: 'Reset token is required',
  [ERROR_CODES.VALIDATION.AUTH_CODE_REQUIRED]: 'Authorization code is required',
  [ERROR_CODES.VALIDATION.AUTH_CODE_LENGTH]: 'Authorization code is required',
  [ERROR_CODES.VALIDATION.TRUST_DEVICE_BOOLEAN]: 'trustDevice must be a boolean',
  [ERROR_CODES.VALIDATION.LANGUAGE_REQUIRED]: 'languagePreference is required',
  [ERROR_CODES.VALIDATION.LANGUAGE_UNSUPPORTED]:
    'languagePreference must be a supported language code',
  [ERROR_CODES.VALIDATION.NAME_EMPTY]: 'Name cannot be empty',
  [ERROR_CODES.VALIDATION.NAME_TOO_LONG]: 'Name cannot exceed 100 characters',
  [ERROR_CODES.VALIDATION.FIELD_MUST_BE_STRING]: '{{field}} must be a string',
  [ERROR_CODES.VALIDATION.FIELD_MAX_LENGTH]: '{{field}} cannot exceed {{max}} characters',
  [ERROR_CODES.VALIDATION.FIELD_EMPTY]: '{{field}} cannot be empty',
  [ERROR_CODES.VALIDATION.PHONE_TOO_LONG]: 'Phone number cannot exceed 30 characters',
  [ERROR_CODES.VALIDATION.PHONE_INVALID]: 'Phone number format looks invalid',
  [ERROR_CODES.VALIDATION.DATE_FORMAT]: 'Date of birth must be YYYY-MM-DD',
  [ERROR_CODES.VALIDATION.DATE_INVALID]: 'Date of birth is not a valid date',
  [ERROR_CODES.VALIDATION.DATE_FUTURE]: 'Date of birth cannot be in the future',
  [ERROR_CODES.VALIDATION.DATE_OUT_OF_RANGE]: 'Date of birth is out of range',
  [ERROR_CODES.VALIDATION.URL_TOO_LONG]: '{{field}} cannot exceed 500 characters',
  [ERROR_CODES.VALIDATION.URL_INVALID]: '{{field}} must be a valid http(s) URL',
  [ERROR_CODES.VALIDATION.BOOLEAN_REQUIRED]: '{{field}} must be a boolean',
  [ERROR_CODES.VALIDATION.PROFILE_FIELD_REQUIRED]: 'At least one profile field is required',
  [ERROR_CODES.VALIDATION.CONFIRM_PHRASE_TOO_LONG]: 'Confirmation phrase is too long',
  [ERROR_CODES.VALIDATION.SESSION_ID_INVALID]: 'Valid session id is required',
  [ERROR_CODES.VALIDATION.TRUSTED_BOOLEAN]: 'trusted must be a boolean',
  [ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_FORMAT]:
    'Authentication code must be a 6-digit number',
  [ERROR_CODES.VALIDATION.TWO_FACTOR_BACKUP_FORMAT]: 'Backup code format looks invalid',
  [ERROR_CODES.VALIDATION.TWO_FACTOR_CODE_REQUIRED]:
    'Authentication code or backup code is required',
  [ERROR_CODES.VALIDATION.INVALID_FIELD]: 'Invalid {{field}}.',
  [ERROR_CODES.VALIDATION.GENERIC]: 'Validation failed.',

  [ERROR_CODES.ACCOUNT.USER_NOT_FOUND]: 'User no longer exists.',
  [ERROR_CODES.ACCOUNT.NAME_EMPTY]: 'Name cannot be empty.',
  [ERROR_CODES.ACCOUNT.EMAIL_ALREADY_REGISTERED]:
    'Email already registered. Please use a different email.',
  [ERROR_CODES.ACCOUNT.DELETE_PASSWORD_REQUIRED]:
    'Password confirmation is required to delete your account.',
  [ERROR_CODES.ACCOUNT.DELETE_PASSWORD_INCORRECT]: 'Password confirmation is incorrect.',
  [ERROR_CODES.ACCOUNT.DELETE_EMAIL_MISMATCH]:
    'Email confirmation does not match your account email.',
  [ERROR_CODES.ACCOUNT.DELETE_PHRASE_REQUIRED]:
    'Type "{{phrase}}" to confirm account deletion.',
  [ERROR_CODES.ACCOUNT.DELETE_OAUTH_REAUTH]:
    'For security, sign out and sign in again with {{provider}}, then delete within {{minutes}} minutes.',
  [ERROR_CODES.ACCOUNT.ALREADY_DEACTIVATED]: 'Account is already deactivated.',
  [ERROR_CODES.ACCOUNT.EXPORT_COOLDOWN]:
    'You can request another export in about {{hours}} hour(s).',

  [ERROR_CODES.SESSION.NOT_FOUND]: 'Session not found.',
  [ERROR_CODES.SESSION.CURRENT_NOT_IDENTIFIED]: 'Current session could not be identified.',
  [ERROR_CODES.SESSION.TRUST_LIMIT_REACHED]:
    'You have reached the maximum number of trusted devices. Remove trust from another device first.',
  [ERROR_CODES.SESSION.REMEMBER_DEVICES_REQUIRED]:
    'Enable Remember Devices in your security settings before trusting devices.',

  [ERROR_CODES.COMMON.ROUTE_NOT_FOUND]: 'Route not found',
  [ERROR_CODES.COMMON.INTERNAL_ERROR]: 'Internal Server Error',
  [ERROR_CODES.COMMON.PAYLOAD_TOO_LARGE]: 'Request payload is too large.',
  [ERROR_CODES.COMMON.FILE_TOO_LARGE]: 'File is too large. Upload a document under 10 MB.',
  [ERROR_CODES.COMMON.FILE_UPLOAD_FAILED]: 'File upload failed. Please check the file and try again.',
  [ERROR_CODES.COMMON.DUPLICATE_EMAIL]:
    'Email already registered. Please use another email or log in.',
  [ERROR_CODES.COMMON.UNKNOWN]: 'Something went wrong. Please try again.',

  [ERROR_CODES.RATE_LIMIT.AUTH]: 'Too many auth attempts. Please try again later.',
  [ERROR_CODES.RATE_LIMIT.SOCIAL_AUTH]: 'Too many social login attempts. Please try again later.',
};

const CODE_PATTERN = /^[A-Z][A-Z0-9]*(?:\.[A-Z][A-Z0-9_]*)+$/;

export const isErrorCode = (value) => typeof value === 'string' && CODE_PATTERN.test(value);

/**
 * Encode validation errors that need interpolation params in express-validator messages.
 * @param {string} code
 * @param {ApiErrorParams} [params]
 */
export const formatValidationCode = (code, params = {}) => {
  if (!params || Object.keys(params).length === 0) {
    return code;
  }
  return `${code}|${JSON.stringify(params)}`;
};

/**
 * @param {string} message
 * @returns {{ code: string, params: ApiErrorParams } | null}
 */
export const parseValidationCode = (message) => {
  if (typeof message !== 'string') return null;

  if (isErrorCode(message)) {
    return { code: message, params: {} };
  }

  const pipeIndex = message.indexOf('|');
  if (pipeIndex <= 0) return null;

  const code = message.slice(0, pipeIndex);
  if (!isErrorCode(code)) return null;

  try {
    const params = JSON.parse(message.slice(pipeIndex + 1));
    return { code, params: params && typeof params === 'object' ? params : {} };
  } catch {
    return { code, params: {} };
  }
};

/**
 * @param {string} code
 * @param {ApiErrorParams} [params]
 */
export const getErrorMessage = (code, params = {}) => {
  const template = ERROR_MESSAGES[code] || code;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) =>
    params[key] !== undefined && params[key] !== null ? String(params[key]) : ''
  );
};
