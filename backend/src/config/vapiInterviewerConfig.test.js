import { describe, expect, it } from 'vitest';
import {
  getVapiInterviewerConfig,
  resolveMaxDurationSeconds,
  resolvePersonaVoiceId,
  resolveSpeakingSpeed,
  PERSONA_VOICE_IDS,
} from '../config/vapiInterviewerConfig.js';

describe('vapiInterviewerConfig', () => {
  it('returns a complete interviewer config with speaking plans', () => {
    const config = getVapiInterviewerConfig();
    expect(config.startSpeakingPlan.waitSeconds).toBeGreaterThan(0);
    expect(config.startSpeakingPlan.smartEndpointingPlan.provider).toBeTruthy();
    expect(config.stopSpeakingPlan.acknowledgementPhrases.length).toBeGreaterThan(5);
    expect(config.voice.provider).toBeTruthy();
  });

  it('caps max duration with buffer', () => {
    const config = getVapiInterviewerConfig();
    const seconds = resolveMaxDurationSeconds(15, config);
    expect(seconds).toBe(15 * 60 + config.durationBufferSeconds);
  });

  it('resolves persona voices for vapi provider', () => {
    const config = getVapiInterviewerConfig();
    expect(resolvePersonaVoiceId('friendly', config)).toBe(PERSONA_VOICE_IDS.friendly);
    expect(resolvePersonaVoiceId('neutral', config)).toBe(PERSONA_VOICE_IDS.neutral);
  });

  it('does not attach speed for default vapi voice provider', () => {
    const config = getVapiInterviewerConfig();
    expect(config.voice.supportsSpeed).toBe(false);
    expect(resolveSpeakingSpeed('hard', config)).toBeUndefined();
  });
});
