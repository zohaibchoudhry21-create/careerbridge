import User from '../models/User.js';
import BuiltResume from '../models/BuiltResume.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { assignVerificationToken } from './verifyEmailController.js';
import { clearAuthCookie } from '../utils/authCookie.js';

const loadUser = (userId) => User.findById(userId);

export const updateAccount = async (req, res, next) => {
  try {
    const user = await loadUser(req.user._id);

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    const { name, email } = req.body;
    let emailChanged = false;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        throw new AppError('Name cannot be empty.', 400);
      }
      user.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser && String(existingUser._id) !== String(user._id)) {
          throw new AppError('Email already registered. Please use a different email.', 400);
        }

        user.email = normalizedEmail;
        emailChanged = true;
      }
    }

    if (emailChanged) {
      const { verificationUrl, emailResult } = await assignVerificationToken(user, {
        name: user.name,
      });

      clearAuthCookie(res);

      const response = {
        user: user.toPublicJSON(),
        requiresEmailVerification: true,
      };

      if (process.env.NODE_ENV === 'development' && emailResult.devMode) {
        response.verificationUrl = verificationUrl;
      }

      return sendResponse(
        res,
        200,
        true,
        'Account updated. Please verify your new email address before signing in again.',
        response
      );
    }

    await user.save();

    sendResponse(res, 200, true, 'Account updated successfully', {
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    if (user.provider !== 'local') {
      throw new AppError('Password changes are only available for email and password accounts.', 400);
    }

    const { currentPassword, newPassword } = req.body;
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect.', 401);
    }

    user.password = newPassword;
    await user.save();

    sendResponse(res, 200, true, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    const { password, confirmEmail } = req.body;

    if (user.provider === 'local') {
      if (!password) {
        throw new AppError('Password confirmation is required to delete your account.', 400);
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new AppError('Password confirmation is incorrect.', 401);
      }
    } else {
      const normalizedConfirmEmail = String(confirmEmail || '')
        .trim()
        .toLowerCase();

      if (!normalizedConfirmEmail || normalizedConfirmEmail !== user.email) {
        throw new AppError('Email confirmation does not match your account email.', 400);
      }
    }

    await BuiltResume.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    clearAuthCookie(res);

    sendResponse(res, 200, true, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
