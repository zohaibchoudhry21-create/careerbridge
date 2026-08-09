/**
 * Mark stale active mock-interview sessions as abandoned.
 * Threshold: 2× selected durationMinutes with no submit (status still active).
 */

import MockInterviewSession from '../../models/MockInterviewSession.js';

/** @param {object} session */
export const getAbandonedThresholdMs = (session = {}) => {
  const minutes = Number(session.durationMinutes) || 15;
  return Math.max(minutes, 10) * 2 * 60 * 1000;
};

/**
 * @param {object} session - mongoose doc or lean object with createdAt/status/durationMinutes
 * @param {number} [nowMs]
 */
export const isSessionPastAbandonedThreshold = (session, nowMs = Date.now()) => {
  if (!session || session.status !== 'active') return false;
  const created = session.createdAt ? new Date(session.createdAt).getTime() : NaN;
  if (!Number.isFinite(created)) return false;
  return nowMs - created > getAbandonedThresholdMs(session);
};

/**
 * If this session is stale-active, mark abandoned and save.
 * Does not generate a report.
 * @returns {Promise<object>} session (possibly updated)
 */
export const maybeAbandonStaleSession = async (session) => {
  if (!session || !isSessionPastAbandonedThreshold(session)) {
    return session;
  }
  session.status = 'abandoned';
  await session.save();
  return session;
};

/**
 * Lazily abandon all of a user's stale active live sessions (e.g. on setup revisit).
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @returns {Promise<number>} count abandoned
 */
export const abandonStaleActiveSessionsForUser = async (userId) => {
  if (!userId) return 0;

  const candidates = await MockInterviewSession.find({
    userId,
    status: 'active',
    mode: 'live',
  }).select('_id status durationMinutes createdAt');

  let count = 0;
  const now = Date.now();
  for (const session of candidates) {
    if (isSessionPastAbandonedThreshold(session, now)) {
      session.status = 'abandoned';
      await session.save();
      count += 1;
    }
  }
  return count;
};

export default {
  getAbandonedThresholdMs,
  isSessionPastAbandonedThreshold,
  maybeAbandonStaleSession,
  abandonStaleActiveSessionsForUser,
};
