import { describe, expect, it } from 'vitest';
import { createInterviewTtlCache } from './interviewTtlCache.js';

describe('createInterviewTtlCache', () => {
  it('returns cached values within TTL and evicts oldest over maxEntries', () => {
    const cache = createInterviewTtlCache({ maxEntries: 2, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('expires entries after TTL', async () => {
    const cache = createInterviewTtlCache({ maxEntries: 4, ttlMs: 5 });
    cache.set('x', 'ok');
    expect(cache.get('x')).toBe('ok');
    await new Promise((r) => setTimeout(r, 12));
    expect(cache.get('x')).toBeUndefined();
  });
});
