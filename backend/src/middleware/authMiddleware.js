import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/sendResponse.js';
import { getTokenFromRequest } from '../utils/authCookie.js';

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError('Not authorized. Please log in.', 401);
    }

    if (!process.env.JWT_SECRET) {
      throw new AppError('Authentication is not configured.', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }

    const tokenVersion = Number(decoded.tokenVersion) || 0;
    const currentVersion = Number(user.tokenVersion) || 0;

    if (tokenVersion !== currentVersion) {
      throw new AppError('Session expired. Please log in again.', 401);
    }

    if (!user.isVerified || user.status !== 'active') {
      throw new AppError('Account is not active. Please verify your email or contact support.', 403);
    }

    req.user = user;
    req.authTokenIssuedAt = typeof decoded.iat === 'number' ? decoded.iat : null;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }
    next(error);
  }
};

export default protect;
