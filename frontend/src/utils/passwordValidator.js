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
    message: 'Must be at least 8 characters long',
  },
  {
    id: 'uppercase',
    test: (password) => /[A-Z]/.test(password),
    message: 'Must include at least one uppercase letter (A-Z)',
  },
  {
    id: 'lowercase',
    test: (password) => /[a-z]/.test(password),
    message: 'Must include at least one lowercase letter (a-z)',
  },
  {
    id: 'number',
    test: (password) => /[0-9]/.test(password),
    message: 'Must include at least one number (0-9)',
  },
  {
    id: 'special',
    test: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
    message: 'Must include at least one special character (e.g. !@#$%^&*)',
  },
];

export const validatePassword = (password = '') => {
  const value = String(password);
  const failedRules = RULES.filter((rule) => !rule.test(value)).map((rule) => rule.message);
  const isCommon = Boolean(value && COMMON_PASSWORDS.has(value.toLowerCase()));

  if (isCommon) {
    failedRules.push('Password is too common. Choose a stronger password');
  }

  const rules = RULES.map((rule) => ({
    id: rule.id,
    message: rule.message,
    passed: rule.test(value),
  }));

  if (value) {
    rules.push({
      id: 'common',
      message: 'Must not be a common password',
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
