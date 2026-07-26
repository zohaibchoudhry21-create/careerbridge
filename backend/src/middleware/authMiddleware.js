import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from '../utils/sendResponse.js';
import { getTokenFromRequest } from '../utils/authCookie.js';
import {
  createUserSession,
  findActiveSession,
  issueAuthToken,
  touchSessionActivity,
} from '../utils/sessionService.js';

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new AppError(ERROR_CODES.AUTH.NOT_AUTHORIZED, 401);
    }

    if (!process.env.JWT_SECRET) {
      throw new AppError(ERROR_CODES.AUTH.AUTH_NOT_CONFIGURED, 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError(ERROR_CODES.ACCOUNT.USER_NOT_FOUND, 401);
    }

    const tokenVersion = Number(decoded.tokenVersion) || 0;
    const currentVersion = Number(user.tokenVersion) || 0;

    if (tokenVersion !== currentVersion) {
      throw new AppError(ERROR_CODES.AUTH.SESSION_EXPIRED, 401);
    }

    if (!user.isVerified) {
      throw new AppError(ERROR_CODES.AUTH.EMAIL_NOT_VERIFIED, 403);
    }

    if (user.status !== 'active') {
      throw new AppError(ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE_SUPPORT, 403);
    }

    let session = null;
    let authSessionId = decoded.sid || null;

    if (authSessionId) {
      session = await findActiveSession(authSessionId, user._id);

      if (!session) {
        throw new AppError(ERROR_CODES.AUTH.SESSION_EXPIRED, 401);
      }

      void touchSessionActivity(session);
    } else {
      session = await createUserSession(user._id, req, {
        remember: true,
        rememberDevicesEnabled: user.rememberDevicesEnabled === true,
      });
      authSessionId = session.sessionId;
      issueAuthToken(res, user, session, true);
    }

    req.user = user;
    req.authSession = session;
    req.authSessionId = authSessionId;
    req.authTokenIssuedAt = typeof decoded.iat === 'number' ? decoded.iat : null;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError(ERROR_CODES.AUTH.TOKEN_INVALID, 401));
    }
    next(error);
  }
};

export default protect;
