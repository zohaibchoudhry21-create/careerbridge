/**
 * Unit tests for live transcript merge helpers + edge cases.
 */

import { describe, expect, it } from 'vitest';
import {
  isKnownTranscriptRole,
  joinTranscriptSegments,
  mergeFinalTranscriptTurn,
  normalizeTranscriptRole,
  turnsToSubmitTranscript,
} from './liveTranscriptMerge.js';

describe('joinTranscriptSegments', () => {
  it('joins with a single space', () => {
    expect(joinTranscriptSegments('Hello there', 'how are you')).toBe('Hello there how are you');
  });

  it('avoids duplicating identical / overlapping text', () => {
    expect(joinTranscriptSegments('I have five years', 'I have five years')).toBe(
      'I have five years'
    );
    expect(joinTranscriptSegments('I have', 'I have five years')).toBe('I have five years');
  });

  it('does not insert a space before leading punctuation', () => {
    expect(joinTranscriptSegments('Yes', '.')).toBe('Yes.');
    expect(joinTranscriptSegments('Okay', '...')).toBe('Okay...');
  });
});

describe('mergeFinalTranscriptTurn', () => {
  it('creates a new turn when speaker changes', () => {
    const first = mergeFinalTranscriptTurn([], {
      speaker: 'ai',
      role: 'assistant',
      text: 'Tell me about yourself.',
      id: 'turn-1',
    });
    const second = mergeFinalTranscriptTurn(first, {
      speaker: 'user',
      role: 'user',
      text: 'I am a backend engineer.',
      id: 'turn-2',
    });
    expect(second).toHaveLength(2);
    expect(second[0].text).toBe('Tell me about yourself.');
    expect(second[1].text).toBe('I am a backend engineer.');
  });

  it('appends consecutive finals from the same speaker into one bubble', () => {
    let turns = mergeFinalTranscriptTurn([], {
      speaker: 'user',
      role: 'user',
      text: 'I have five years of experience.',
      id: 'turn-1',
    });
    turns = mergeFinalTranscriptTurn(turns, {
      speaker: 'user',
      role: 'user',
      text: 'Mostly with Node and MongoDB.',
      id: 'turn-2',
    });
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe(
      'I have five years of experience. Mostly with Node and MongoDB.'
    );
  });

  it('replaces when a final is cumulative of the previous segment', () => {
    let turns = mergeFinalTranscriptTurn([], {
      speaker: 'ai',
      role: 'assistant',
      text: 'Thanks for that',
      id: 'turn-1',
    });
    turns = mergeFinalTranscriptTurn(turns, {
      speaker: 'ai',
      role: 'assistant',
      text: 'Thanks for that answer. Can you go deeper?',
      id: 'turn-2',
    });
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe('Thanks for that answer. Can you go deeper?');
  });

  it('keeps submit payload shape { role, content }', () => {
    const turns = [
      { speaker: 'ai', role: 'assistant', text: 'Hello' },
      { speaker: 'user', role: 'user', text: 'Hi there' },
    ];
    expect(turnsToSubmitTranscript(turns)).toEqual([
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Hi there' },
    ]);
  });

  // --- Edge cases ---

  it('handles rapid sequential finals without dropping merges (ref-style chaining)', () => {
    // Simulates turnsRef updates: each merge sees the previous result immediately.
    const bursts = [
      'I built',
      'the checkout',
      'service last year.',
    ];
    let turns = [];
    for (const text of bursts) {
      turns = mergeFinalTranscriptTurn(turns, {
        speaker: 'user',
        role: 'user',
        text,
      });
    }
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe('I built the checkout service last year.');
  });

  it('returns null for missing/unexpected roles instead of guessing assistant', () => {
    expect(normalizeTranscriptRole(null)).toBeNull();
    expect(normalizeTranscriptRole(undefined)).toBeNull();
    expect(normalizeTranscriptRole('')).toBeNull();
    expect(normalizeTranscriptRole('system')).toBeNull();
    expect(isKnownTranscriptRole('user')).toBe(true);
    expect(isKnownTranscriptRole('assistant')).toBe(true);
    expect(isKnownTranscriptRole(null)).toBe(false);
  });

  it('excludes empty turns from submit (orphaned partials never enter turns)', () => {
    const committed = [
      { speaker: 'ai', role: 'assistant', text: 'Hello' },
      { speaker: 'user', role: 'user', text: '  ' },
    ];
    // livePreview is separate UI state — not passed here. Submit stays finals-only.
    expect(turnsToSubmitTranscript(committed)).toEqual([{ role: 'assistant', content: 'Hello' }]);
  });

  it('creates the first entry correctly when the array is empty', () => {
    const turns = mergeFinalTranscriptTurn([], {
      speaker: 'ai',
      role: 'assistant',
      text: 'Welcome to the interview.',
      id: 'turn-1',
    });
    expect(turns).toHaveLength(1);
    expect(turns[0]).toMatchObject({
      speaker: 'ai',
      role: 'assistant',
      text: 'Welcome to the interview.',
      id: 'turn-1',
    });
  });

  it('merges short one-word finals with proper spacing (not YesOkay or Yes .)', () => {
    let turns = mergeFinalTranscriptTurn([], {
      speaker: 'user',
      role: 'user',
      text: 'Yes.',
    });
    turns = mergeFinalTranscriptTurn(turns, {
      speaker: 'user',
      role: 'user',
      text: 'Okay.',
    });
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe('Yes. Okay.');
    expect(turns[0].text).not.toContain('YesOkay');
    expect(turns[0].text).not.toContain('Yes .');
  });
});
