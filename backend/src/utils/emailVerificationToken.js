import crypto from 'crypto';

const VERIFICATION_EXPIRE_MINUTES = Number(process.env.EMAIL_VERIFICATION_EXPIRE_MINUTES) || 15;

export const createEmailVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expireAt = new Date(Date.now() + VERIFICATION_EXPIRE_MINUTES * 60 * 1000);

  return { rawToken, hashedToken, expireAt };
};

export const hashEmailVerificationToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');
