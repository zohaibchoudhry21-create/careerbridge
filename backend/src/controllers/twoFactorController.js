import { sendResponse } from '../utils/sendResponse.js';
import User from '../models/User.js';
import { sendWelcomeEmailIfNeeded } from '../utils/welcomeEmailService.js';
import {
  beginTwoFactorChallenge,
  completeAuthenticatedLogin,
  confirmTwoFactor,
  disableTwoFactor,
  getTwoFactorRecoveryMessage,
  getTwoFactorStatus,
  needsTwoFactorChallenge,
  regenerateBackupCodes,
  setupTwoFactor,
  verifyTwoFactorLogin,
} from '../utils/twoFactorService.js';
import { clearTwoFactorChallengeCookie } from '../utils/authCookie.js';

export const getStatus = async (req, res, next) => {
  try {
    const status = await getTwoFactorStatus(req.user._id);

    sendResponse(res, 200, true, 'Two-factor status fetched successfully', status);
  } catch (error) {
    next(error);
  }
};

export const setup = async (req, res, next) => {
  try {
    const data = await setupTwoFactor(req.user);

    sendResponse(res, 200, true, 'Two-factor setup started', data);
  } catch (error) {
    next(error);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const data = await confirmTwoFactor(req.user, req.body.code);

    sendResponse(res, 200, true, 'Two-factor authentication enabled', data);
  } catch (error) {
    next(error);
  }
};

export const disable = async (req, res, next) => {
  try {
    await disableTwoFactor(req, req.body);
    const refreshedUser = await User.findById(req.user._id);

    sendResponse(res, 200, true, 'Two-factor authentication disabled', {
      user: refreshedUser.toPublicJSON(),
      recoveryMessage: getTwoFactorRecoveryMessage(),
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateBackupCodesHandler = async (req, res, next) => {
  try {
    const data = await regenerateBackupCodes(req, req.body);

    sendResponse(res, 200, true, 'Backup codes regenerated', data);
  } catch (error) {
    next(error);
  }
};

export const verifyLogin = async (req, res, next) => {
  try {
    const result = await verifyTwoFactorLogin(res, req, req.body);

    sendResponse(res, 200, true, 'Login successful', {
      user: result.user.toPublicJSON(),
    });

    if (result.source === 'social' || result.isNewUser) {
      void sendWelcomeEmailIfNeeded(result.user, { isNewUser: result.isNewUser });
    }
  } catch (error) {
    next(error);
  }
};

export const issueLoginChallengeIfNeeded = async (
  res,
  req,
  { user, remember, trustDevice, source, isNewUser = false }
) => {
  if (!(await needsTwoFactorChallenge(user, req, { trustDevice }))) {
    return false;
  }

  beginTwoFactorChallenge(res, req, {
    user,
    remember,
    trustDevice,
    source,
    isNewUser,
  });

  return true;
};

export const finalizeLogin = async (
  res,
  req,
  { user, remember, trustDevice, source, isNewUser = false }
) => {
  const result = await completeAuthenticatedLogin(res, req, {
    user,
    remember,
    trustDevice,
    source,
    isNewUser,
  });

  if (source === 'social' || isNewUser) {
    void sendWelcomeEmailIfNeeded(user, { isNewUser });
  }

  return result;
};

export const clearChallenge = async (_req, res, next) => {
  try {
    clearTwoFactorChallengeCookie(res);
    sendResponse(res, 200, true, 'Two-factor challenge cleared');
  } catch (error) {
    next(error);
  }
};
