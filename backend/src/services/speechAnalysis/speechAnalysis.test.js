import { describe, expect, it } from 'vitest';
import {
  computeAcousticMetrics,
  derivePauseEventsFromSamples,
} from './acousticMetrics.js';
import {
  computeLinguisticMetrics,
  computePronunciationScore,
  computeVocabularyFeatures,
} from './linguisticMetrics.js';
import { buildSpeechTimelineEvents, computeThinkingTimeMetrics } from './pauseTimeline.js';
import { composeSpeechScores, fillerHealthScore, pauseHealthScore } from './scoreComposer.js';
import { analyzeSpeechMonitoring } from './speechAnalysisService.js';

describe('acousticMetrics', () => {
  it('computes energy and volume stability from RMS samples', () => {
    const samples = [
      { tMs: 0, rms: 0.1 },
      { tMs: 250, rms: 0.12 },
      { tMs: 500, rms: 0.11 },
      { tMs: 750, rms: 0.1 },
    ];
    const result = computeAcousticMetrics({ acousticSamples: samples });
    expect(result.energy).toBeGreaterThan(0);
    expect(result.volumeStability).toBeGreaterThan(50);
    expect(result.pitchStability).toBeNull();
  });

  it('derives short and long pause events from silence streaks', () => {
    const samples = [];
    for (let i = 0; i < 20; i += 1) {
      samples.push({ tMs: i * 250, rms: i >= 4 && i < 10 ? 0.01 : 0.15 });
    }
    const events = derivePauseEventsFromSamples(samples);
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'long' || e.durationMs >= 1200)).toBe(true);
  });
});

describe('linguisticMetrics', () => {
  it('reuses filler counting and computes speaking-time WPM', () => {
    const transcript = 'I um think that uh the project was successful overall.';
    const result = computeLinguisticMetrics({
      transcript,
      durationSeconds: 10,
      silenceRatio: 0.2,
    });
    expect(result.fillerWords).toBeGreaterThanOrEqual(2);
    expect(result.speechSpeedWpm).toBeGreaterThan(0);
    expect(result.vocabularyQuality).toBeGreaterThan(0);
  });

  it('returns null pronunciation without Whisper segments', () => {
    expect(computePronunciationScore([])).toBeNull();
    expect(computePronunciationScore(undefined)).toBeNull();
  });

  it('maps Whisper avg_logprob to pronunciation score', () => {
    const score = computePronunciationScore([
      { avg_logprob: -0.3 },
      { avg_logprob: -0.4 },
    ]);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('computes deterministic vocabulary features', () => {
    const vocab = computeVocabularyFeatures(
      'Leadership communication collaboration delivery ownership metrics impact roadmap'
    );
    expect(vocab.typeTokenRatio).toBeGreaterThan(0.5);
    expect(vocab.vocabularyQuality).toBeGreaterThan(50);
  });
});

describe('scoreComposer', () => {
  it('scores filler and pause health from measured ratios', () => {
    expect(fillerHealthScore(1)).toBe(100);
    expect(fillerHealthScore(8)).toBe(0);
    expect(pauseHealthScore(1000, 10000)).toBe(100);
    expect(pauseHealthScore(5000, 10000)).toBe(0);
  });

  it('composes fluency and communication without inventing missing grammar', () => {
    const scores = composeSpeechScores({
      speedInBandScore: 90,
      fillersPer100Words: 2,
      longPauseDurationMs: 1000,
      durationMs: 60000,
      volumeStability: 80,
      pitchStability: 70,
      energyCv: 0.2,
      pitchCv: 0.1,
      speechSpeedWpm: 140,
      vocabularyQuality: 75,
      grammarQuality: null,
    });
    expect(scores.fluency).toBeGreaterThan(50);
    expect(scores.communicationScore).toBeGreaterThan(50);
    expect(scores.speakingConfidence).toBeGreaterThan(50);
  });
});

describe('pauseTimeline', () => {
  it('builds throttled timeline events', () => {
    const events = buildSpeechTimelineEvents({
      pauseEvents: [
        { tMs: 1000, durationMs: 1500, type: 'long' },
        { tMs: 8000, durationMs: 1600, type: 'long' },
      ],
      speechSpeedWpm: 200,
      fillersPer100Words: 9,
      energyCv: 0.8,
      durationMs: 60000,
    });
    expect(events.some((e) => e.type === 'long_pause')).toBe(true);
    expect(events.some((e) => e.type === 'speaking_too_fast')).toBe(true);
    expect(events[0].offsetLabel).toMatch(/^\d{2}:\d{2}$/);
  });

  it('estimates thinking time from turn structure', () => {
    const thinking = computeThinkingTimeMetrics(
      [
        { role: 'assistant', content: 'Tell me about yourself.' },
        { role: 'user', content: 'I am a developer.' },
        { role: 'assistant', content: 'Next question.' },
        { role: 'user', content: 'I led a team.' },
      ],
      { durationMs: 120000 }
    );
    expect(thinking.thinkingEpisodeCount).toBeGreaterThan(0);
    expect(thinking.thinkingTimeTotalMs).toBeGreaterThan(0);
  });
});

describe('analyzeSpeechMonitoring', () => {
  it('returns professional metrics without Groq and null pronunciation on live path', async () => {
    const result = await analyzeSpeechMonitoring({
      transcript: 'I actually built an API um with clear ownership and metrics.',
      turns: [
        { role: 'assistant', content: 'Walk me through a project.' },
        { role: 'user', content: 'I actually built an API um with clear ownership and metrics.' },
      ],
      durationMs: 30000,
      liveAudioHints: {
        averageVolume: 0.12,
        silenceRatio: 0.15,
        longPauseCount: 1,
        acousticSamples: [
          { tMs: 0, rms: 0.1, pitchHz: 140 },
          { tMs: 250, rms: 0.11, pitchHz: 145 },
          { tMs: 500, rms: 0.09, pitchHz: 142 },
          { tMs: 750, rms: 0.1, pitchHz: 138 },
          { tMs: 1000, rms: 0.12, pitchHz: 141 },
          { tMs: 1250, rms: 0.11, pitchHz: 143 },
          { tMs: 1500, rms: 0.1, pitchHz: 139 },
          { tMs: 1750, rms: 0.1, pitchHz: 140 },
          { tMs: 2000, rms: 0.01 },
          { tMs: 2250, rms: 0.01 },
          { tMs: 2500, rms: 0.01 },
          { tMs: 2750, rms: 0.01 },
          { tMs: 3000, rms: 0.01 },
          { tMs: 3250, rms: 0.12, pitchHz: 144 },
        ],
        pauseEvents: [{ tMs: 2000, durationMs: 1250, type: 'long' }],
      },
      enableGroqLinguistics: false,
    });

    expect(result.metrics.speechSpeed).toBeGreaterThan(0);
    expect(result.metrics.fillerWords).toBeGreaterThanOrEqual(1);
    expect(result.metrics.energy).toBeGreaterThan(0);
    expect(result.metrics.volumeStability).not.toBeNull();
    expect(result.metrics.pitchStability).not.toBeNull();
    expect(result.metrics.pronunciationScore).toBeNull();
    expect(result.metrics.grammarQuality).toBeNull();
    expect(result.metrics.fluency).toBeGreaterThan(0);
    expect(result.metrics.communicationScore).toBeGreaterThan(0);
    expect(result.metrics.sources.pronunciation).toBe('unavailable');
    expect(Array.isArray(result.timelineEvents)).toBe(true);
  });
});
