import UserSession from '../models/UserSession.js';
import { sendLoginAlertEmail } from './emailService.js';

const HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const RATE_LIMIT_MS = 60 * 60 * 1000;

const recentAlerts = new Map();

const isLoginAlertsEnabled = (user) => user?.loginAlertsEnabled !== false;

const isTrustedDeviceForUser = (user, session) =>
  user?.rememberDevicesEnabled === true && Boolean(session?.isTrusted);

const isKnownIp = (ipAddress) => {
  const value = String(ipAddress || '').trim();
  return Boolean(value && value !== 'Unknown');
};

const buildRateLimitKey = (userId, session) =>
  `${userId}:${session.deviceFingerprint || ''}:${session.ipAddress || ''}`;

const isRateLimited = (key) => {
  const lastSentAt = recentAlerts.get(key);
  if (!lastSentAt) return false;
  return Date.now() - lastSentAt < RATE_LIMIT_MS;
};

const markAlertSent = (key) => {
  recentAlerts.set(key, Date.now());

  if (recentAlerts.size > 5000) {
    const cutoff = Date.now() - RATE_LIMIT_MS;
    for (const [entryKey, sentAt] of recentAlerts.entries()) {
      if (sentAt < cutoff) {
        recentAlerts.delete(entryKey);
      }
    }
  }
};

const shouldSendLoginAlert = async (user, session) => {
  if (!isLoginAlertsEnabled(user)) return false;
  if (isTrustedDeviceForUser(user, session)) return false;

  const historyCutoff = new Date(Date.now() - HISTORY_WINDOW_MS);
  const baseQuery = {
    userId: user._id,
    _id: { $ne: session._id },
    createdAt: { $gte: historyCutoff },
  };

  const seenFingerprint = await UserSession.exists({
    ...baseQuery,
    deviceFingerprint: session.deviceFingerprint,
  });

  let seenIp = true;
  if (isKnownIp(session.ipAddress)) {
    seenIp = await UserSession.exists({
      ...baseQuery,
      ipAddress: session.ipAddress,
    });
  }

  return !seenFingerprint || !seenIp;
};

export const evaluateAndSendLoginAlert = async ({ user, session, source = 'login' }) => {
  try {
    if (!user || !session) return;

    const shouldAlert = await shouldSendLoginAlert(user, session);
    if (!shouldAlert) return;

    const rateLimitKey = buildRateLimitKey(user._id, session);
    if (isRateLimited(rateLimitKey)) return;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const signedInAt = session.createdAt || new Date();

    const emailResult = await sendLoginAlertEmail({
      to: user.email,
      name: user.name,
      deviceLabel: session.deviceLabel,
      ipAddress: session.ipAddress,
      signedInAt,
      securityUrl: `${clientUrl}/settings/login-security`,
      source,
    });

    if (emailResult.sent || emailResult.devMode) {
      markAlertSent(rateLimitKey);
    }
  } catch (error) {
    console.error('[LoginAlert] Failed to evaluate or send login alert:', error.message);
  }
};

export default evaluateAndSendLoginAlert;
