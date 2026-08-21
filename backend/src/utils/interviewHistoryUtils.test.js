import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { serializeInterviewReport } from './interviewReportSerializer.js';
import {
  buildHistoryPagination,
  indexReportsBySourceId,
  mapSessionHistoryItem,
  mapSessionHistoryItems,
  parseHistoryPagination,
  savedInterviewReportQuery,
  sessionHistoryOwnerFilter,
} from './interviewHistoryUtils.js';

const session = {
  _id: '64a1b2c3d4e5f67890123456',
  role: 'frontend-developer',
  roleLabel: 'Frontend Developer',
  difficulty: 'medium',
  durationMinutes: 15,
  targetQuestionCount: 5,
  status: 'completed',
  createdAt: '2026-08-20T10:00:00.000Z',
  callDurationMs: 840000,
};

describe('sessionHistoryOwnerFilter', () => {
  it('scopes history queries to the authenticated user only', () => {
    const userId = '64aaaaaaaaaaaaaaaaaaaaaa';
    expect(sessionHistoryOwnerFilter(userId)).toEqual({ userId });
  });
});

describe('savedInterviewReportQuery', () => {
  it('loads a cached mock-interview report for the session owner', () => {
    const userId = '64aaaaaaaaaaaaaaaaaaaaaa';
    const sessionId = session._id;
    expect(savedInterviewReportQuery(userId, sessionId)).toEqual({
      userId,
      sourceType: 'mock_interview',
      sourceId: sessionId,
    });
  });
});

describe('parseHistoryPagination', () => {
  it('defaults to page 1 and limit 10', () => {
    expect(parseHistoryPagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('clamps limit to 20 and computes skip', () => {
    expect(parseHistoryPagination({ page: 3, limit: 50 })).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
    });
  });
});

describe('buildHistoryPagination', () => {
  it('returns empty pagination metadata', () => {
    expect(buildHistoryPagination(1, 10, 0)).toEqual({
      currentPage: 1,
      totalPages: 0,
      total: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('computes multi-page metadata', () => {
    expect(buildHistoryPagination(2, 10, 25)).toEqual({
      currentPage: 2,
      totalPages: 3,
      total: 25,
      hasNext: true,
      hasPrev: true,
    });
  });
});

describe('mapSessionHistoryItem', () => {
  it('omits score when no report exists', () => {
    const item = mapSessionHistoryItem(session, null);
    expect(item.overallScore).toBeNull();
    expect(item.reportAvailable).toBe(false);
    expect(item.roleLabel).toBe('Frontend Developer');
    expect(item.questionCount).toBe(5);
  });

  it('does not invent a score when overallScore is missing', () => {
    const item = mapSessionHistoryItem(session, { sourceId: session._id });
    expect(item.reportAvailable).toBe(true);
    expect(item.overallScore).toBeNull();
  });

  it('attaches a real overallScore when the saved report has one', () => {
    const item = mapSessionHistoryItem(session, {
      sourceId: session._id,
      overallScore: 72.4,
    });
    expect(item.reportAvailable).toBe(true);
    expect(item.overallScore).toBe(72);
  });

  it('allows a genuine zero score without treating it as missing', () => {
    const item = mapSessionHistoryItem(session, {
      sourceId: session._id,
      overallScore: 0,
    });
    expect(item.overallScore).toBe(0);
  });
});

describe('mapSessionHistoryItems', () => {
  it('joins reports by sourceId and leaves unmatched sessions without scores', () => {
    const other = { ...session, _id: '64bbbbbbbbbbbbbbbbbbbbbb', status: 'abandoned' };
    const reports = indexReportsBySourceId([
      { sourceId: session._id, overallScore: 81 },
    ]);
    const items = mapSessionHistoryItems([session, other], reports);
    expect(items[0].overallScore).toBe(81);
    expect(items[1].overallScore).toBeNull();
    expect(items[1].status).toBe('abandoned');
  });

  it('does not embed full report or transcript fields in list summaries', () => {
    const item = mapSessionHistoryItem(session, { sourceId: session._id, overallScore: 70 });
    expect(item).not.toHaveProperty('enterpriseReport');
    expect(item).not.toHaveProperty('transcript');
    expect(item).not.toHaveProperty('userId');
  });
});

describe('saved report fetch', () => {
  it('exposes REPORT_UNAVAILABLE for missing cached reports', () => {
    expect(ERROR_CODES.INTERVIEW_PREP.REPORT_UNAVAILABLE).toBe(
      'INTERVIEW_PREP.REPORT_UNAVAILABLE'
    );
  });

  it('returns the stored score through the existing serializer without inventing one', () => {
    const payload = serializeInterviewReport(
      {
        sourceType: 'mock_interview',
        sourceId: session._id,
        overallScore: 64,
        scoreVersion: 1,
        sections: {},
        strengths: [],
        improvementAreas: [],
        recommendedNextSteps: [],
        createdAt: session.createdAt,
      },
      session._id
    );
    expect(payload.overallScore).toBe(64);
    expect(payload.sessionId).toBe(session._id);
  });
});
