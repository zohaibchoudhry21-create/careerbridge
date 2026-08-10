import User from '../models/User.js';
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
} from '../utils/emailVerificationToken.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';

const buildVerificationUrl = (rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/verify-email?token=${rawToken}`;
};

export const assignVerificationToken = async (user, options = {}) => {
  const { rawToken, hashedToken, expireAt } = createEmailVerificationToken();
  const recipientName = resolveRegistrationName(options.name, user);

  if (recipientName && user.name !== recipientName) {
    user.name = recipientName;
  }

  user.verificationToken = hashedToken;
  user.verificationTokenExpires = expireAt;
  user.status = 'inactive';
  user.isVerified = false;
  await user.save({ validateBeforeSave: false });

  const verificationUrl = buildVerificationUrl(rawToken);
  const emailResult = await sendVerificationEmail({
    to: user.email,
    name: recipientName,
    verificationUrl,
  });

  return { verificationUrl, emailResult, recipientName };
};

const resolveRegistrationName = (requestedName, user) => {
  const trimmedRequest = String(requestedName || '').trim();
  if (trimmedRequest) return trimmedRequest;

  const trimmedStored = String(user?.name || '').trim();
  if (trimmedStored) return trimmedStored;

  return String(user?.email || '').split('@')[0]?.trim() || 'there';
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError(ERROR_CODES.VERIFY.TOKEN_REQUIRED, 400);
    }

    const hashedToken = hashEmailVerificationToken(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    }).select('+verificationToken');

    if (!user) {
      throw new AppError(ERROR_CODES.VERIFY.TOKEN_INVALID, 400);
    }

    if (user.isVerified && user.status === 'active') {
      return sendResponse(res, 200, true, 'Email already verified. You can now log in.');
    }

    user.isVerified = true;
    user.status = 'active';
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    sendResponse(res, 200, true, 'Email verified successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(res, 200, true, 'If that email exists, a verification link has been sent.');
    }

    if (user.isVerified) {
      throw new AppError(ERROR_CODES.VERIFY.EMAIL_ALREADY_VERIFIED, 400);
    }

    const { verificationUrl, emailResult } = await assignVerificationToken(user);

    const response = {
      success: true,
      message: 'If that email exists, a verification link has been sent.',
    };

    if (process.env.NODE_ENV === 'development' && emailResult.devMode) {
      response.verificationUrl = emailResult.verificationUrl || verificationUrl;
      if (emailResult.previewUrl) {
        response.emailPreviewUrl = emailResult.previewUrl;
      }
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
