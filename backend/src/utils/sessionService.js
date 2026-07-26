import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import UserSession from '../models/UserSession.js';
import { AppError } from './sendResponse.js';
import generateToken from './generateToken.js';
import { setAuthCookie } from './authCookie.js';

export const MAX_SESSIONS_PER_USER = 20;
export const MAX_TRUSTED_SESSIONS_PER_USER = 10;
const TRUST_HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

export const getJwtExpireMs = () => {
  const raw = process.env.JWT_EXPIRE || '7d';
  const match = String(raw).match(/^(\d+)([dhms])$/i);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    case 's':
      return value * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};

export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }

  return req.ip || req.socket?.remoteAddress || 'Unknown';
};

export const buildDeviceFingerprint = (browser, os) =>
  `${String(browser || 'unknown').trim().toLowerCase()}|${String(os || 'unknown').trim().toLowerCase()}`;

export const parseRequestClient = (req) => {
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const browserName = browser.name || 'Unknown browser';
  const osName = os.name || 'Unknown OS';

  return {
    deviceLabel: `${browserName} on ${osName}`,
    browser: browserName,
    browserVersion: browser.version || '',
    os: osName,
    osVersion: os.version || '',
    userAgent,
    ipAddress: getClientIp(req),
    deviceFingerprint: buildDeviceFingerprint(browserName, osName),
  };
};

export const serializeSession = (session, currentSessionId) => ({
  id: String(session._id),
  deviceLabel: session.deviceLabel || 'Unknown device',
  browser: session.browser || '',
  os: session.os || '',
  ipAddress: session.ipAddress || 'Unknown',
  location: '',
  createdAt: session.createdAt,
  lastActiveAt: session.lastActiveAt,
  isCurrent: session.sessionId === currentSessionId,
  isTrusted: Boolean(session.isTrusted),
  trustedAt: session.trustedAt || null,
});

export const countTrustedActiveSessions = async (userId, excludeSessionId = null) => {
  const query = {
    userId,
    isTrusted: true,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  return UserSession.countDocuments(query);
};

export const assertCanTrustSession = async (userId, excludeSessionId = null) => {
  const trustedCount = await countTrustedActiveSessions(userId, excludeSessionId);

  if (trustedCount >= MAX_TRUSTED_SESSIONS_PER_USER) {
    throw new AppError(
      'You have reached the maximum number of trusted devices. Remove trust from another device first.',
      400
    );
  }
};

const hasTrustedFingerprintHistory = async (userId, deviceFingerprint) => {
  if (!deviceFingerprint) return false;

  const historyCutoff = new Date(Date.now() - TRUST_HISTORY_WINDOW_MS);

  return UserSession.exists({
    userId,
    deviceFingerprint,
    isTrusted: true,
    createdAt: { $gte: historyCutoff },
  });
};

const resolveSessionTrust = async (
  userId,
  deviceFingerprint,
  { rememberDevicesEnabled = false, trustDevice = false } = {}
) => {
  if (!rememberDevicesEnabled) {
    return { isTrusted: false, trustedAt: null };
  }

  if (trustDevice) {
    try {
      await assertCanTrustSession(userId);
      return { isTrusted: true, trustedAt: new Date() };
    } catch {
      return { isTrusted: false, trustedAt: null };
    }
  }

  const previouslyTrusted = await hasTrustedFingerprintHistory(userId, deviceFingerprint);
  if (!previouslyTrusted) {
    return { isTrusted: false, trustedAt: null };
  }

  const trustedCount = await countTrustedActiveSessions(userId);
  if (trustedCount >= MAX_TRUSTED_SESSIONS_PER_USER) {
    return { isTrusted: false, trustedAt: null };
  }

  return { isTrusted: true, trustedAt: new Date() };
};

export const clearAllSessionTrust = async (userId) => {
  await UserSession.updateMany(
    { userId, isTrusted: true },
    { isTrusted: false, trustedAt: null }
  );
};

export const setSessionTrust = async (userId, sessionId, trusted) => {
  const session = await UserSession.findOne({
    _id: sessionId,
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw new AppError('Session not found.', 404);
  }

  if (trusted) {
    if (!session.isTrusted) {
      await assertCanTrustSession(userId, session._id);
    }
    session.isTrusted = true;
    session.trustedAt = new Date();
  } else {
    session.isTrusted = false;
    session.trustedAt = null;
  }

  await session.save();
  return session;
};

export const enforceSessionCap = async (userId) => {
  const activeSessions = await UserSession.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActiveAt: 1 })
    .select('_id');

  const overflow = activeSessions.length - MAX_SESSIONS_PER_USER + 1;

  if (overflow <= 0) {
    return;
  }

  const idsToRevoke = activeSessions.slice(0, overflow).map((session) => session._id);

  await UserSession.updateMany({ _id: { $in: idsToRevoke } }, { revokedAt: new Date() });
};

export const createUserSession = async (
  userId,
  req,
  { remember = true, rememberDevicesEnabled = false, trustDevice = false } = {}
) => {
  await enforceSessionCap(userId);

  const client = parseRequestClient(req);
  const now = new Date();
  const trust = await resolveSessionTrust(userId, client.deviceFingerprint, {
    rememberDevicesEnabled,
    trustDevice,
  });

  return UserSession.create({
    userId,
    sessionId: crypto.randomUUID(),
    ...client,
    lastActiveAt: now,
    expiresAt: new Date(now.getTime() + getJwtExpireMs()),
    isTrusted: trust.isTrusted,
    trustedAt: trust.trustedAt,
  });
};

export const createUserSessionWithClientMeta = async (
  userId,
  clientMeta,
  { remember = true, rememberDevicesEnabled = false, trustDevice = false } = {}
) => {
  await enforceSessionCap(userId);

  const now = new Date();
  const trust = await resolveSessionTrust(userId, clientMeta.deviceFingerprint, {
    rememberDevicesEnabled,
    trustDevice,
  });

  return UserSession.create({
    userId,
    sessionId: crypto.randomUUID(),
    ...clientMeta,
    lastActiveAt: now,
    expiresAt: new Date(now.getTime() + getJwtExpireMs()),
    isTrusted: trust.isTrusted,
    trustedAt: trust.trustedAt,
  });
};

export const shouldSkipTwoFactor = async (user, req, { trustDevice = false } = {}) => {
  if (user?.rememberDevicesEnabled !== true) {
    return false;
  }

  const client = parseRequestClient(req);

  if (trustDevice) {
    const trustedCount = await countTrustedActiveSessions(user._id);
    if (trustedCount < MAX_TRUSTED_SESSIONS_PER_USER) {
      return true;
    }
  }

  return Boolean(await hasTrustedFingerprintHistory(user._id, client.deviceFingerprint));
};

export const issueAuthToken = (res, user, session, remember = true) => {
  const token = generateToken(user._id, user.tokenVersion, session.sessionId);
  setAuthCookie(res, token, remember);
  return token;
};

export const findActiveSession = (sessionId, userId) =>
  UserSession.findOne({
    sessionId,
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

export const touchSessionActivity = async (session) => {
  if (!session?._id) return;

  const lastActiveAt = session.lastActiveAt ? new Date(session.lastActiveAt) : null;
  const shouldUpdate =
    !lastActiveAt || Date.now() - lastActiveAt.getTime() > LAST_ACTIVE_THROTTLE_MS;

  if (!shouldUpdate) return;

  await UserSession.updateOne({ _id: session._id }, { lastActiveAt: new Date() });
};

export const revokeSessionBySid = async (sessionId, userId) => {
  if (!sessionId || !userId) return null;

  const session = await UserSession.findOne({ sessionId, userId });

  if (!session || session.revokedAt) {
    return null;
  }

  session.revokedAt = new Date();
  await session.save();
  return session;
};

export const revokeOtherSessions = async (userId, currentSessionId) => {
  await UserSession.updateMany(
    {
      userId,
      sessionId: { $ne: currentSessionId },
      revokedAt: null,
    },
    { revokedAt: new Date() }
  );
};

export const revokeAllSessionsForUser = async (userId) => {
  await UserSession.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
};

export const listActiveSessionsForUser = (userId) =>
  UserSession.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActiveAt: -1 });
