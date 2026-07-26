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
  const failedRules = RULES.filter((rule) => !rule.test(value)).map((rule) => rule.id);
  const isCommon = Boolean(value && COMMON_PASSWORDS.has(value.toLowerCase()));

  if (isCommon) {
    failedRules.push('tooCommon');
  }

  const rules = RULES.map((rule) => ({
    id: rule.id,
    passed: rule.test(value),
  }));

  if (value) {
    rules.push({
      id: 'common',
      passed: !isCommon,
    });
  }

  return {
    valid: failedRules.length === 0,
    errors: failedRules,
    rules,
  };
};

export const getPasswordErrorMessage = (password) => {
  const { errors } = validatePassword(password);
  if (errors.length === 0) return null;
  return errors.join('. ');
};

export default validatePassword;
