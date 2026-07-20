import jwt from 'jsonwebtoken';

/**
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {number} [tokenVersion=0] - Bumped on password change/reset to invalidate older JWTs
 */
const generateToken = (userId, tokenVersion = 0) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: userId, tokenVersion: Number(tokenVersion) || 0 },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

export default generateToken;
