import User from '../models/User.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import {
  createReactivationChallenge,
  consumeReactivationChallenge,
  getReactivationChallenge,
} from './reactivationChallengeStore.js';
import {
  clearReactivationChallengeCookie,
  getReactivationChallengeIdFromRequest,
  setReactivationChallengeCookie,
} from './authCookie.js';
import { parseRequestClient } from './sessionService.js';
import {
  finalizeLogin,
  issueLoginChallengeIfNeeded,
} from '../controllers/twoFactorController.js';

export const needsReactivationChallenge = (user) => user?.status === 'deactivated';

export const beginReactivationChallenge = (
  res,
  req,
  { user, remember = true, trustDevice = false, source = 'login', isNewUser = false }
) => {
  const clientMeta = parseRequestClient(req);
  const challengeId = createReactivationChallenge({
    userId: String(user._id),
    remember,
    trustDevice,
    source,
    isNewUser: Boolean(isNewUser),
    clientMeta,
  });

  setReactivationChallengeCookie(res, challengeId);
};

export const confirmReactivation = async (res, req) => {
  const challengeId = getReactivationChallengeIdFromRequest(req);
  const challenge = getReactivationChallenge(challengeId);

  if (!challenge) {
    throw new AppError(ERROR_CODES.REACTIVATION.SESSION_EXPIRED, 401);
  }

  const user = await User.findById(challenge.userId);

  if (!user) {
    consumeReactivationChallenge(challengeId);
    clearReactivationChallengeCookie(res);
    throw new AppError(ERROR_CODES.ACCOUNT.USER_NOT_FOUND, 404);
  }

  if (user.status !== 'deactivated') {
    consumeReactivationChallenge(challengeId);
    clearReactivationChallengeCookie(res);
    throw new AppError(ERROR_CODES.REACTIVATION.NOT_DEACTIVATED, 400);
  }

  user.status = 'active';
  await user.save();

  const consumed = consumeReactivationChallenge(challengeId);
  clearReactivationChallengeCookie(res);

  const requiresTwoFactor = await issueLoginChallengeIfNeeded(res, req, {
    user,
    remember: consumed.remember,
    trustDevice: consumed.trustDevice,
    source: consumed.source,
    isNewUser: consumed.isNewUser,
  });

  if (requiresTwoFactor) {
    return {
      requires2FA: true,
      user,
      source: consumed.source,
      isNewUser: consumed.isNewUser,
    };
  }

  await finalizeLogin(res, req, {
    user,
    remember: consumed.remember,
    trustDevice: consumed.trustDevice,
    source: consumed.source,
    isNewUser: consumed.isNewUser,
  });

  return {
    user,
    requires2FA: false,
    source: consumed.source,
    isNewUser: consumed.isNewUser,
  };
};

export const cancelReactivationChallenge = (res, req) => {
  const challengeId = getReactivationChallengeIdFromRequest(req);
  if (challengeId) {
    consumeReactivationChallenge(challengeId);
  }
  clearReactivationChallengeCookie(res);
};

export default confirmReactivation;
