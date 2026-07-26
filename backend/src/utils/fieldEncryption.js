import crypto from 'crypto';
import { AppError } from './sendResponse.js';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const VERSION_PREFIX = 'v1';

const resolveEncryptionKey = () => {
  const raw = process.env.TOTP_ENCRYPTION_KEY || process.env.LINKEDIN_CRED_ENCRYPTION_KEY;

  if (!raw || !String(raw).trim()) {
    throw new AppError(
      'Two-factor encryption is not configured. Set TOTP_ENCRYPTION_KEY in the server environment.',
      500
    );
  }

  const value = String(raw).trim();

  if (/^[0-9a-f]{64}$/i.test(value)) {
    return Buffer.from(value, 'hex');
  }

  try {
    const decoded = Buffer.from(value, 'base64');
    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    // fall through to hash derivation
  }

  return crypto.createHash('sha256').update(value).digest();
};

export const encryptField = (plaintext) => {
  if (plaintext === undefined || plaintext === null || plaintext === '') {
    return null;
  }

  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
};

export const decryptField = (payload) => {
  if (payload === undefined || payload === null || payload === '') {
    return null;
  }

  const parts = String(payload).split(':');
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new AppError('Stored secret could not be decrypted.', 500);
  }

  const [, ivHex, authTagHex, ciphertextHex] = parts;
  const key = resolveEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

export const TWO_FACTOR_RECOVERY_MESSAGE =
  'If you lose your authenticator and all backup codes, sign-in will require manual recovery. Contact support from your registered email so we can verify your identity and disable two-factor authentication on your account.';
