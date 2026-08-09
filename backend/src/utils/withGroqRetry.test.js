import { describe, expect, it, vi } from 'vitest';
import { isRetryableGroqError, withGroqRetry } from './withGroqRetry.js';

describe('isRetryableGroqError', () => {
  it('retries 429 and 5xx', () => {
    expect(isRetryableGroqError({ status: 429 })).toBe(true);
    expect(isRetryableGroqError({ status: 503 })).toBe(true);
  });

  it('does not retry ordinary 4xx', () => {
    expect(isRetryableGroqError({ status: 400 })).toBe(false);
    expect(isRetryableGroqError({ status: 401 })).toBe(false);
  });
});

describe('withGroqRetry', () => {
  it('retries then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('busy'), { status: 429 }))
      .mockResolvedValueOnce('ok');

    await expect(withGroqRetry(fn, { retries: 2, baseDelayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('fails fast on non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('bad'), { status: 400 }));
    await expect(withGroqRetry(fn, { retries: 2, baseDelayMs: 1 })).rejects.toThrow('bad');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
