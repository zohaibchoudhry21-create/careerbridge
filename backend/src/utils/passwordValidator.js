import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'admin123',
  'letmein',
  'welcome',
  'iloveyou',
  'monkey123',
  'abc12345',
  'changeme',
  'football',
  'master123',
  'demo123456',
]);

const RULES = [
  {
    id: 'length',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    test: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  },
];

export const validatePassword = (password = '') => {
  const value = String(password);
  const failedRuleIds = RULES.filter((rule) => !rule.test(value)).map((rule) => rule.id);
  const isCommon = Boolean(value && COMMON_PASSWORDS.has(value.toLowerCase()));

  const errors = [];
  if (failedRuleIds.length > 0) {
    errors.push(failedRuleIds[0]);
  }
  if (isCommon) {
    errors.push('common');
  }

  return {
    valid: errors.length === 0,
    errors,
    failedRuleIds,
    isCommon,
  };
};

export const getPasswordErrorCode = (password) => {
  const { failedRuleIds, isCommon } = validatePassword(password);

  if (failedRuleIds.length > 0) {
    return {
      code: ERROR_CODES.PASSWORD.POLICY_VIOLATION,
      params: { rule: failedRuleIds[0] },
    };
  }

  if (isCommon) {
    return { code: ERROR_CODES.PASSWORD.TOO_COMMON, params: {} };
  }

  return null;
};

/** @deprecated Use getPasswordErrorCode — kept for transitional compatibility */
export const getPasswordErrorMessage = (password) => {
  const result = getPasswordErrorCode(password);
  if (!result) return null;
  return formatValidationCode(result.code, result.params);
};

export default validatePassword;
