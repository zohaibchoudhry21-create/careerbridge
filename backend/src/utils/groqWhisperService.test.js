import { describe, expect, it } from 'vitest';
import { assertAudioDurationWithinCap } from './groqWhisperService.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';

describe('assertAudioDurationWithinCap', () => {
  it('allows missing duration', () => {
    expect(() => assertAudioDurationWithinCap(undefined, undefined)).not.toThrow();
  });

  it('allows durations under the cap', () => {
    expect(() => assertAudioDurationWithinCap(60_000)).not.toThrow();
    expect(() => assertAudioDurationWithinCap(undefined, 600)).not.toThrow();
  });

  it('rejects durations over 20 minutes', () => {
    try {
      assertAudioDurationWithinCap(1_200_001);
      throw new Error('expected throw');
    } catch (error) {
      expect(error.code).toBe(ERROR_CODES.INTERVIEW_PREP.AUDIO_TOO_LONG);
      expect(error.statusCode).toBe(400);
    }
  });
});
