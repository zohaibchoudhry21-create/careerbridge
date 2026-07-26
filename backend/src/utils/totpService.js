import { generateSecret, generateURI, verifySync } from 'otplib';

const ISSUER = process.env.TOTP_ISSUER || 'CareerBridge';
const TOTP_OPTIONS = { digits: 6, period: 30, window: 1 };

export const createTotpSecret = () => generateSecret();

export const buildOtpAuthUrl = ({ secret, email, issuer = ISSUER }) =>
  generateURI({
    issuer,
    label: email,
    secret,
  });

export const verifyTotpCode = (secret, token) => {
  if (!secret || !token) return false;

  const result = verifySync({
    token: String(token).trim(),
    secret,
    digits: TOTP_OPTIONS.digits,
    period: TOTP_OPTIONS.period,
    window: TOTP_OPTIONS.window,
  });

  return result.valid === true;
};

export const getTotpIssuer = () => ISSUER;

export default verifyTotpCode;
