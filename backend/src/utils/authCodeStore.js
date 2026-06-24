import crypto from 'crypto';

const CODE_TTL_MS = 5 * 60 * 1000;
const codes = new Map();

const purgeExpiredCodes = () => {
  const now = Date.now();

  for (const [code, entry] of codes.entries()) {
    if (entry.expiresAt <= now) {
      codes.delete(code);
    }
  }
};

export const createAuthCode = (userId, { isNewUser = false } = {}) => {
  purgeExpiredCodes();

  const code = crypto.randomBytes(32).toString('hex');
  codes.set(code, {
    userId: String(userId),
    isNewUser: Boolean(isNewUser),
    expiresAt: Date.now() + CODE_TTL_MS,
  });

  return code;
};

export const consumeAuthCode = (code) => {
  if (!code || typeof code !== 'string') {
    return null;
  }

  purgeExpiredCodes();

  const entry = codes.get(code);

  if (!entry || entry.expiresAt <= Date.now()) {
    codes.delete(code);
    return null;
  }

  codes.delete(code);
  return {
    userId: entry.userId,
    isNewUser: Boolean(entry.isNewUser),
  };
};

export default createAuthCode;
