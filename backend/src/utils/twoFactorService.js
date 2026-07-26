import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import {
  decryptField,
  encryptField,
  TWO_FACTOR_RECOVERY_MESSAGE,
} from './fieldEncryption.js';
import {
  buildOtpAuthUrl,
  createTotpSecret,
  getTotpIssuer,
  verifyTotpCode,
} from './totpService.js';
import {
  createTwoFactorChallenge,
  consumeTwoFactorChallenge,
  getTwoFactorChallenge,
  incrementTwoFactorChallengeFailures,
  MAX_TWO_FACTOR_VERIFY_ATTEMPTS,
} from './twoFactorChallengeStore.js';
import {
  createUserSession,
  createUserSessionWithClientMeta,
  issueAuthToken,
  parseRequestClient,
  revokeOtherSessions,
  shouldSkipTwoFactor,
} from './sessionService.js';
import { evaluateAndSendLoginAlert } from './loginAlertService.js';
import {
  clearTwoFactorChallengeCookie,
  getTwoFactorChallengeIdFromRequest,
  setTwoFactorChallengeCookie,
} from './authCookie.js';

const BACKUP_CODE_COUNT = 10;
const OAUTH_REAUTH_WINDOW_MINUTES = 15;

const loadUserWithTwoFactorSecrets = (userId) =>
  User.findById(userId).select(
    '+twoFactorSecret +twoFactorPendingSecret +twoFactorBackupCodes +password'
  );

const decryptUserSecret = (encryptedValue) => {
  if (!encryptedValue) return null;
  return decryptField(encryptedValue);
};

const encryptUserSecret = (plaintext) => encryptField(plaintext);

const formatBackupCode = (raw) =>
  `${raw.slice(0, 4)}-${raw.slice(4)}`.toUpperCase();

const normalizeBackupCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const generateBackupCodes = async () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes = [];
  const hashed = [];

  while (codes.length < BACKUP_CODE_COUNT) {
    let raw = '';
    for (let i = 0; i < 8; i += 1) {
      raw += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    const formatted = formatBackupCode(raw);
    codes.push(formatted);
    hashed.push({
      hash: await bcrypt.hash(normalizeBackupCode(formatted), 10),
      usedAt: null,
    });
  }

  return { codes, hashed };
};

const verifyBackupCode = async (user, backupCode) => {
  const normalized = normalizeBackupCode(backupCode);
  if (!normalized) return false;

  for (const entry of user.twoFactorBackupCodes || []) {
    if (entry.usedAt) continue;
    const matches = await bcrypt.compare(normalized, entry.hash);
    if (matches) {
      entry.usedAt = new Date();
      await user.save();
      return true;
    }
  }

  return false;
};

const assertFreshOAuthSession = (req) => {
  const issuedAt = req.authTokenIssuedAt;
  const maxAgeSeconds = OAUTH_REAUTH_WINDOW_MINUTES * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (typeof issuedAt !== 'number' || nowSeconds - issuedAt > maxAgeSeconds) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.OAUTH_REAUTH_REQUIRED, 403, {
      minutes: OAUTH_REAUTH_WINDOW_MINUTES,
    });
  }
};

export const getTwoFactorRecoveryMessage = () => TWO_FACTOR_RECOVERY_MESSAGE;

export const needsTwoFactorChallenge = async (user, req, { trustDevice = false } = {}) => {
  if (user?.twoFactorEnabled !== true) {
    return false;
  }

  return !(await shouldSkipTwoFactor(user, req, { trustDevice }));
};

export const beginTwoFactorChallenge = (
  res,
  req,
  { user, remember = true, trustDevice = false, source = 'login', isNewUser = false }
) => {
  const clientMeta = parseRequestClient(req);
  const challengeId = createTwoFactorChallenge({
    userId: String(user._id),
    remember,
    trustDevice,
    source,
    isNewUser: Boolean(isNewUser),
    clientMeta,
  });

  setTwoFactorChallengeCookie(res, challengeId);
};

export const completeAuthenticatedLogin = async (
  res,
  req,
  {
    user,
    remember = true,
    trustDevice = false,
    source = 'login',
    isNewUser = false,
    clientMeta = null,
  }
) => {
  const session = clientMeta
    ? await createUserSessionWithClientMeta(user._id, clientMeta, {
        remember,
        rememberDevicesEnabled: user.rememberDevicesEnabled === true,
        trustDevice,
      })
    : await createUserSession(user._id, req, {
        remember,
        rememberDevicesEnabled: user.rememberDevicesEnabled === true,
        trustDevice,
      });

  issueAuthToken(res, user, session, remember);
  clearTwoFactorChallengeCookie(res);

  void evaluateAndSendLoginAlert({ user, session, source });

  return { user, session, isNewUser, source };
};

export const setupTwoFactor = async (user) => {
  if (user.twoFactorEnabled) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.ALREADY_ENABLED, 400);
  }

  const secret = createTotpSecret();
  user.twoFactorPendingSecret = encryptUserSecret(secret);
  await user.save();

  return {
    otpauthUrl: buildOtpAuthUrl({ secret, email: user.email, issuer: getTotpIssuer() }),
    manualEntryKey: secret,
    issuer: getTotpIssuer(),
    recoveryMessage: TWO_FACTOR_RECOVERY_MESSAGE,
  };
};

export const confirmTwoFactor = async (user, code) => {
  const userWithSecrets = await loadUserWithTwoFactorSecrets(user._id);

  if (!userWithSecrets) {
    throw new AppError(ERROR_CODES.ACCOUNT.USER_NOT_FOUND, 404);
  }

  if (userWithSecrets.twoFactorEnabled) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.ALREADY_ENABLED, 400);
  }

  const pendingSecret = decryptUserSecret(userWithSecrets.twoFactorPendingSecret);
  if (!pendingSecret) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.SETUP_REQUIRED, 400);
  }

  if (!verifyTotpCode(pendingSecret, code)) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.INVALID_CODE, 400);
  }

  const { codes, hashed } = await generateBackupCodes();

  userWithSecrets.twoFactorSecret = encryptUserSecret(pendingSecret);
  userWithSecrets.twoFactorPendingSecret = null;
  userWithSecrets.twoFactorEnabled = true;
  userWithSecrets.twoFactorConfirmedAt = new Date();
  userWithSecrets.twoFactorBackupCodes = hashed;
  await userWithSecrets.save();

  return {
    backupCodes: codes,
    recoveryMessage: TWO_FACTOR_RECOVERY_MESSAGE,
  };
};

export const disableTwoFactor = async (req, { password, code, backupCode }) => {
  const user = await loadUserWithTwoFactorSecrets(req.user._id);

  if (!user?.twoFactorEnabled) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.NOT_ENABLED, 400);
  }

  if (user.provider === 'local') {
    if (!password) {
      throw new AppError(ERROR_CODES.TWO_FACTOR.PASSWORD_REQUIRED_DISABLE, 400);
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(ERROR_CODES.TWO_FACTOR.PASSWORD_INCORRECT, 401);
    }
  } else {
    assertFreshOAuthSession(req);
  }

  const secret = decryptUserSecret(user.twoFactorSecret);
  const codeValid = code ? verifyTotpCode(secret, code) : false;
  const backupValid = backupCode ? await verifyBackupCode(user, backupCode) : false;

  if (!codeValid && !backupValid) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.CODE_OR_BACKUP_REQUIRED, 401);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  user.twoFactorPendingSecret = null;
  user.twoFactorBackupCodes = [];
  user.twoFactorConfirmedAt = null;
  await user.save();

  if (req.authSessionId) {
    await revokeOtherSessions(user._id, req.authSessionId);
  }
};

export const regenerateBackupCodes = async (req, { password, code }) => {
  const user = await loadUserWithTwoFactorSecrets(req.user._id);

  if (!user?.twoFactorEnabled) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.NOT_ENABLED, 400);
  }

  if (user.provider === 'local') {
    if (!password) {
      throw new AppError(ERROR_CODES.TWO_FACTOR.PASSWORD_REQUIRED_REGEN, 400);
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(ERROR_CODES.TWO_FACTOR.PASSWORD_INCORRECT, 401);
    }
  } else {
    assertFreshOAuthSession(req);
  }

  const secret = decryptUserSecret(user.twoFactorSecret);
  if (!verifyTotpCode(secret, code)) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.INVALID_CODE, 401);
  }

  const { codes, hashed } = await generateBackupCodes();
  user.twoFactorBackupCodes = hashed;
  await user.save();

  return {
    backupCodes: codes,
    recoveryMessage: TWO_FACTOR_RECOVERY_MESSAGE,
  };
};

export const getTwoFactorStatus = async (userId) => {
  const user = await User.findById(userId).select('+twoFactorBackupCodes');

  if (!user) {
    throw new AppError(ERROR_CODES.ACCOUNT.USER_NOT_FOUND, 404);
  }

  const remainingBackupCodes = (user.twoFactorBackupCodes || []).filter((entry) => !entry.usedAt)
    .length;

  return {
    enabled: user.twoFactorEnabled === true,
    backupCodesRemaining: remainingBackupCodes,
    recoveryMessage: TWO_FACTOR_RECOVERY_MESSAGE,
  };
};

export const verifyTwoFactorLogin = async (res, req, { code, backupCode }) => {
  const challengeId = getTwoFactorChallengeIdFromRequest(req);
  const challenge = getTwoFactorChallenge(challengeId);

  if (!challenge) {
    throw new AppError(ERROR_CODES.TWO_FACTOR.CHALLENGE_EXPIRED, 401);
  }

  if (challenge.failedAttempts >= MAX_TWO_FACTOR_VERIFY_ATTEMPTS) {
    consumeTwoFactorChallenge(challengeId);
    clearTwoFactorChallengeCookie(res);
    throw new AppError(ERROR_CODES.TWO_FACTOR.TOO_MANY_ATTEMPTS, 429);
  }

  const user = await loadUserWithTwoFactorSecrets(challenge.userId);
  if (!user?.twoFactorEnabled) {
    consumeTwoFactorChallenge(challengeId);
    clearTwoFactorChallengeCookie(res);
    throw new AppError(ERROR_CODES.TWO_FACTOR.NOT_ENABLED_FOR_ACCOUNT, 400);
  }

  const secret = decryptUserSecret(user.twoFactorSecret);
  const codeValid = code ? verifyTotpCode(secret, code) : false;
  const backupValid = backupCode ? await verifyBackupCode(user, backupCode) : false;

  if (!codeValid && !backupValid) {
    const failures = incrementTwoFactorChallengeFailures(challengeId);
    if (failures >= MAX_TWO_FACTOR_VERIFY_ATTEMPTS) {
      consumeTwoFactorChallenge(challengeId);
      clearTwoFactorChallengeCookie(res);
      throw new AppError(ERROR_CODES.TWO_FACTOR.TOO_MANY_ATTEMPTS, 429);
    }

    throw new AppError(ERROR_CODES.TWO_FACTOR.INVALID_CODE, 401);
  }

  const consumed = consumeTwoFactorChallenge(challengeId);
  const loginResult = await completeAuthenticatedLogin(res, req, {
    user,
    remember: consumed.remember,
    trustDevice: consumed.trustDevice,
    source: consumed.source,
    isNewUser: consumed.isNewUser,
    clientMeta: consumed.clientMeta,
  });

  return {
    user: loginResult.user,
    session: loginResult.session,
    isNewUser: consumed.isNewUser,
    source: consumed.source,
  };
};

export default verifyTwoFactorLogin;
