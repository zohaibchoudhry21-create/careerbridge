import jwt from 'jsonwebtoken';

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [tokenVersion=0] - Bumped on password change/reset to invalidate older JWTs
 * @param {string} [sessionId] - Active session identifier for per-device revocation
 */
const generateToken = (userId, tokenVersion = 0, sessionId = null) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = {
    id: userId,
    tokenVersion: Number(tokenVersion) || 0,
  };

  if (sessionId) {
    payload.sid = sessionId;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
