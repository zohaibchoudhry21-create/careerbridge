import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { assignVerificationToken } from './verifyEmailController.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { setAuthCookie, clearAuthCookie, getTokenFromRequest, clearTwoFactorChallengeCookie, clearReactivationChallengeCookie } from '../utils/authCookie.js';
import { consumeAuthCode } from '../utils/authCodeStore.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { sendWelcomeEmailIfNeeded } from '../utils/welcomeEmailService.js';
import {
  createUserSession,
  issueAuthToken,
  revokeAllSessionsForUser,
  revokeSessionBySid,
} from '../utils/sessionService.js';
import { evaluateAndSendLoginAlert } from '../utils/loginAlertService.js';
import {
  finalizeLogin,
  issueLoginChallengeIfNeeded,
} from './twoFactorController.js';
import {
  beginReactivationChallenge,
  needsReactivationChallenge,
} from '../utils/reactivationService.js';

const buildResetPasswordUrl = (rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/reset-password?token=${rawToken}`;
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        const { verificationUrl, emailResult } = await assignVerificationToken(existingUser, {
          name,
        });

        const response = {
          success: true,
          message: 'Account exists but is not verified. A new verification email has been sent.',
          user: existingUser.toPublicJSON(),
        };

        if (process.env.NODE_ENV === 'development' && emailResult.devMode) {
          response.verificationUrl = emailResult.verificationUrl || verificationUrl;
          if (emailResult.previewUrl) {
            response.emailPreviewUrl = emailResult.previewUrl;
          }
        }

        return res.status(200).json(response);
      }

      throw new AppError(ERROR_CODES.AUTH.EMAIL_ALREADY_REGISTERED, 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      provider: 'local',
      status: 'inactive',
      isVerified: false,
    });

    const { verificationUrl, emailResult } = await assignVerificationToken(user, { name });

    const response = {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: user.toPublicJSON(),
    };

    if (process.env.NODE_ENV === 'development' && emailResult.devMode) {
      response.verificationUrl = emailResult.verificationUrl || verificationUrl;
      if (emailResult.previewUrl) {
        response.emailPreviewUrl = emailResult.previewUrl;
      }
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(ERROR_CODES.AUTH.INVALID_CREDENTIALS, 401);
    }

    if (!user.isVerified) {
      throw new AppError(ERROR_CODES.AUTH.EMAIL_NOT_VERIFIED, 403);
    }

    if (user.status === 'inactive') {
      throw new AppError(ERROR_CODES.AUTH.EMAIL_NOT_VERIFIED, 403);
    }

    if (needsReactivationChallenge(user)) {
      const remember = req.body.remember !== false;
      const trustDevice = req.body.trustDevice === true;

      beginReactivationChallenge(res, req, {
        user,
        remember,
        trustDevice,
        source: 'login',
      });

      return sendResponse(res, 200, true, 'Account reactivation required.', {
        requiresReactivation: true,
      });
    }

    if (user.status !== 'active') {
      throw new AppError(ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE_SUPPORT, 403);
    }

    const remember = req.body.remember !== false;
    const trustDevice = req.body.trustDevice === true;

    const requiresTwoFactor = await issueLoginChallengeIfNeeded(res, req, {
      user,
      remember,
      trustDevice,
      source: 'login',
    });

    if (requiresTwoFactor) {
      return sendResponse(res, 200, true, 'Two-factor authentication required.', {
        requires2FA: true,
      });
    }

    await finalizeLogin(res, req, {
      user,
      remember,
      trustDevice,
      source: 'login',
    });

    sendResponse(res, 200, true, 'Login successful', {
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    sendResponse(res, 200, true, 'User profile fetched successfully', {
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.sid && decoded?.id) {
          await revokeSessionBySid(decoded.sid, decoded.id);
        }
      } catch {
        // Allow logout even when the token is expired or invalid.
      }
    }

    clearAuthCookie(res);
    clearTwoFactorChallengeCookie(res);
    clearReactivationChallengeCookie(res);
    sendResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(res, 200, true, 'If that email exists, a reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = buildResetPasswordUrl(resetToken);
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    const response = {
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    };

    if (process.env.NODE_ENV === 'development') {
      if (emailResult.devMode) {
        response.resetUrl = resetUrl;
      }
      response.resetToken = resetToken;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw new AppError(ERROR_CODES.AUTH.RESET_TOKEN_INVALID, 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save();

    await revokeAllSessionsForUser(user._id);
    const session = await createUserSession(user._id, req, {
      remember: true,
      rememberDevicesEnabled: user.rememberDevicesEnabled === true,
    });
    issueAuthToken(res, user, session, true);

    sendResponse(res, 200, true, 'Password reset successful', {
      user: user.toPublicJSON(),
    });

    void evaluateAndSendLoginAlert({ user, session, source: 'reset_password' });
  } catch (error) {
    next(error);
  }
};

export const exchangeSocialCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    const authPayload = consumeAuthCode(code);

    if (!authPayload?.userId) {
      throw new AppError(ERROR_CODES.AUTH.AUTH_CODE_INVALID, 400);
    }

    const { userId, isNewUser } = authPayload;
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(ERROR_CODES.ACCOUNT.USER_NOT_FOUND, 401);
    }

    if (!user.isVerified) {
      throw new AppError(ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE, 403);
    }

    if (needsReactivationChallenge(user)) {
      beginReactivationChallenge(res, req, {
        user,
        remember: true,
        trustDevice: false,
        source: 'social',
        isNewUser,
      });

      return sendResponse(res, 200, true, 'Account reactivation required.', {
        requiresReactivation: true,
      });
    }

    if (user.status !== 'active') {
      throw new AppError(ERROR_CODES.AUTH.ACCOUNT_NOT_ACTIVE, 403);
    }

    const requiresTwoFactor = await issueLoginChallengeIfNeeded(res, req, {
      user,
      remember: true,
      trustDevice: false,
      source: 'social',
      isNewUser,
    });

    if (requiresTwoFactor) {
      return sendResponse(res, 200, true, 'Two-factor authentication required.', {
        requires2FA: true,
      });
    }

    await finalizeLogin(res, req, {
      user,
      remember: true,
      trustDevice: false,
      source: 'social',
      isNewUser,
    });

    sendResponse(res, 200, true, 'Login successful', {
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};
