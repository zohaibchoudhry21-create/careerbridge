import {
  INTERVIEW_FORMATS,
  INTERVIEW_HISTORY_DEFAULT_LIMIT,
  INTERVIEW_HISTORY_DEFAULT_PAGE,
  INTERVIEW_HISTORY_MAX_LIMIT,
} from '../constants/interviewPrepConstants.js';

export const SESSION_HISTORY_SELECT =
  'role roleLabel difficulty durationMinutes targetQuestionCount status createdAt callDurationMs reportId interviewFormat';

/**
 * @param {unknown} userId
 * @param {{ interviewFormat?: string }} [options]
 */
export const sessionHistoryOwnerFilter = (userId, options = {}) => {
  const filter = { userId };
  const format = String(options.interviewFormat || '').trim().toLowerCase();
  if (format && INTERVIEW_FORMATS.includes(format)) {
    if (format === 'standard') {
      // Legacy sessions omit interviewFormat; treat them as standard mock.
      filter.$or = [{ interviewFormat: 'standard' }, { interviewFormat: { $exists: false } }];
    } else {
      filter.interviewFormat = format;
    }
  }
  return filter;
};

export const savedInterviewReportQuery = (userId, sessionId) => ({
  userId,
  sourceType: 'mock_interview',
  sourceId: sessionId,
});

export const parseHistoryPagination = (query = {}) => {
  const pageRaw = Number(query.page);
  const limitRaw = Number(query.limit);
  const page =
    Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : INTERVIEW_HISTORY_DEFAULT_PAGE;
  const unboundedLimit =
    Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : INTERVIEW_HISTORY_DEFAULT_LIMIT;
  const limit = Math.min(unboundedLimit, INTERVIEW_HISTORY_MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildHistoryPagination = (page, limit, total) => {
  const safeTotal = Math.max(0, Number(total) || 0);
  const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / limit);
  return {
    currentPage: page,
    totalPages,
    total: safeTotal,
    hasNext: page * limit < safeTotal,
    hasPrev: page > 1,
  };
};

const finiteScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.min(100, Math.max(0, Math.round(score)));
};

export const mapSessionHistoryItem = (session, report) => {
  const reportAvailable = Boolean(report);
  const overallScore = reportAvailable ? finiteScore(report.overallScore) : null;

  return {
    sessionId: String(session._id),
    role: session.role || '',
    roleLabel: String(session.roleLabel || session.role || '').trim(),
    difficulty: session.difficulty || null,
    durationMinutes: session.durationMinutes ?? null,
    questionCount: session.targetQuestionCount ?? null,
    status: session.status || 'setup',
    interviewFormat: session.interviewFormat || 'standard',
    createdAt: session.createdAt,
    callDurationMs: Number.isFinite(Number(session.callDurationMs))
      ? Number(session.callDurationMs)
      : null,
    reportAvailable,
    overallScore,
  };
};

export const indexReportsBySourceId = (reports = []) => {
  const map = new Map();
  for (const report of reports) {
    if (report?.sourceId == null) continue;
    map.set(String(report.sourceId), report);
  }
  return map;
};

export const mapSessionHistoryItems = (sessions, reportsBySourceId) =>
  sessions.map((session) =>
    mapSessionHistoryItem(session, reportsBySourceId.get(String(session._id)) || null)
  );
