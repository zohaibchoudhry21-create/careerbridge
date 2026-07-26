import { describe, expect, it } from 'vitest';
import { getInterviewPrepRateLimitKey } from './interviewPrepRateLimitKey.js';

describe('getInterviewPrepRateLimitKey', () => {
  it('uses user id when the request is authenticated', () => {
    const key = getInterviewPrepRateLimitKey({
      user: { _id: '507f1f77bcf86cd799439011' },
      ip: '203.0.113.10',
    });
    expect(key).toBe('user:507f1f77bcf86cd799439011');
  });

  it('falls back to client IP when user is absent', () => {
    const key = getInterviewPrepRateLimitKey({ ip: '203.0.113.10' });
    expect(key).toBe('ip:203.0.113.10');
  });
});
