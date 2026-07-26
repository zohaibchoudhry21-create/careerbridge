import User from '../models/User.js';
import BuiltResume from '../models/BuiltResume.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { assignVerificationToken } from './verifyEmailController.js';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie.js';
import generateToken from '../utils/generateToken.js';
import {
  clearAllSessionTrust,
  issueAuthToken,
  revokeAllSessionsForUser,
  revokeOtherSessions,
  setSessionTrust,
} from '../utils/sessionService.js';

const ACCOUNT_DELETE_CONFIRMATION = 'DELETE MY ACCOUNT';
/** OAuth destructive actions require a freshly issued session (minutes). */
const OAUTH_REAUTH_WINDOW_MINUTES = 15;

const loadUser = (userId) => User.findById(userId);

const OPTIONAL_STRING_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'gender',
  'country',
  'state',
  'city',
  'linkedin',
  'portfolio',
  'headline',
];

const applyOptionalStringField = (user, field, value) => {
  if (value === undefined) return;
  user[field] = value === null ? '' : String(value).trim();
};

const syncDisplayNameFromParts = (user) => {
  const first = String(user.firstName || '').trim();
  const last = String(user.lastName || '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  if (combined) {
    user.name = combined.slice(0, 100);
  }
};

export const updateAccount = async (req, res, next) => {
  try {
    const user = await loadUser(req.user._id);

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    const { name, email, dateOfBirth } = req.body;
    let emailChanged = false;
    const namePartsTouched =
      req.body.firstName !== undefined || req.body.lastName !== undefined;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        throw new AppError('Name cannot be empty.', 400);
      }
      user.name = trimmedName;
    }

    for (const field of OPTIONAL_STRING_FIELDS) {
      applyOptionalStringField(user, field, req.body[field]);
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === '') {
        user.dateOfBirth = null;
      } else {
        user.dateOfBirth = new Date(`${String(dateOfBirth).trim()}T00:00:00.000Z`);
      }
    }

    // Keep legacy `name` in sync when the Personal Information form sends name parts.
    if (namePartsTouched && name === undefined) {
      syncDisplayNameFromParts(user);
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

    if (req.body.loginAlertsEnabled !== undefined) {
      user.loginAlertsEnabled = Boolean(req.body.loginAlertsEnabled);
    }

    if (req.body.rememberDevicesEnabled !== undefined) {
      user.rememberDevicesEnabled = Boolean(req.body.rememberDevicesEnabled);
    }

    if (emailChanged) {
      const { verificationUrl, emailResult } = await assignVerificationToken(user, {
        name: user.name,
      });

      clearAuthCookie(res);
      await revokeAllSessionsForUser(user._id);

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

    const isSameAsCurrent = await user.comparePassword(newPassword);
    if (isSameAsCurrent) {
      throw new AppError('New password must be different from your current password.', 400);
    }

    user.password = newPassword;
    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save();

    await clearAllSessionTrust(user._id);
    await revokeOtherSessions(user._id, req.authSessionId);

    const session = req.authSession;
    if (session) {
      session.isTrusted = false;
      session.trustedAt = null;
      await session.save();
      issueAuthToken(res, user, session, true);
    } else {
      const token = generateToken(user._id, user.tokenVersion);
      setAuthCookie(res, token, true);
    }

    sendResponse(res, 200, true, 'Password updated successfully. Other sessions have been signed out.');
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

    const { password, confirmEmail, confirmPhrase } = req.body;

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

      const phrase = String(confirmPhrase || '').trim().toUpperCase();
      if (phrase !== ACCOUNT_DELETE_CONFIRMATION) {
        throw new AppError(
          `Type "${ACCOUNT_DELETE_CONFIRMATION}" to confirm account deletion.`,
          400
        );
      }

      const issuedAt = req.authTokenIssuedAt;
      const maxAgeSeconds = OAUTH_REAUTH_WINDOW_MINUTES * 60;
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (
        typeof issuedAt !== 'number' ||
        nowSeconds - issuedAt > maxAgeSeconds
      ) {
        throw new AppError(
          `For security, sign out and sign in again with ${user.provider}, then delete within ${OAUTH_REAUTH_WINDOW_MINUTES} minutes.`,
          403
        );
      }
    }

    await BuiltResume.deleteMany({ userId: user._id });
    await revokeAllSessionsForUser(user._id);
    await User.deleteOne({ _id: user._id });
    clearAuthCookie(res);

    sendResponse(res, 200, true, 'Account deleted successfully');
  } catch (error) {
    next(error);
  }
};
