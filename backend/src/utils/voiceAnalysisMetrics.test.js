import { describe, expect, it } from 'vitest';
import {
  computePauseRatio,
  computeWpm,
  countFillerWords,
  countWords,
} from './voiceAnalysisMetrics.js';

const SAMPLE_TRANSCRIPT =
  'Um, I basically led a team of five and, like, delivered the project on time.';

const SAMPLE_SEGMENTS = [
  { start: 0, end: 1.2 },
  { start: 1.5, end: 4.0 },
  { start: 5.0, end: 8.0 },
];

describe('countFillerWords', () => {
  it('counts known filler phrases in a transcript', () => {
    expect(countFillerWords(SAMPLE_TRANSCRIPT)).toBe(3);
  });

  it('returns 0 for empty input', () => {
    expect(countFillerWords('')).toBe(0);
    expect(countFillerWords('We delivered on schedule with clear communication.')).toBe(0);
  });
});

describe('computeWpm', () => {
  it('rounds words per minute from transcript and duration', () => {
    expect(countWords(SAMPLE_TRANSCRIPT)).toBe(15);
    expect(computeWpm(SAMPLE_TRANSCRIPT, 10)).toBe(90);
  });

  it('returns 0 when duration or word count is missing', () => {
    expect(computeWpm('', 10)).toBe(0);
    expect(computeWpm(SAMPLE_TRANSCRIPT, 0)).toBe(0);
  });
});

describe('computePauseRatio', () => {
  it('computes silence share from Whisper segments vs total duration', () => {
    const speechSeconds = 1.2 + 2.5 + 3;
    const expected = Number(((10 - speechSeconds) / 10).toFixed(3));
    expect(computePauseRatio(SAMPLE_SEGMENTS, 10)).toBe(expected);
    expect(computePauseRatio(SAMPLE_SEGMENTS, 10)).toBeGreaterThan(0);
    expect(computePauseRatio(SAMPLE_SEGMENTS, 10)).toBeLessThan(1);
  });

  it('returns 0 when segments or duration are invalid', () => {
    expect(computePauseRatio([], 10)).toBe(0);
    expect(computePauseRatio(SAMPLE_SEGMENTS, 0)).toBe(0);
  });
});
