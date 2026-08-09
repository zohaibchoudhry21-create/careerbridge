import { describe, expect, it } from 'vitest';
import { evaluateClientMetricsAnomalies } from './clientMetricsValidation.js';
import { assembleInterviewReport } from './reportAssembler.js';
import {
  buildDeterministicFallbackNarrative,
  NARRATIVE_FALLBACK_SUMMARY,
} from './groq/enterpriseNarrativeGroq.js';

describe('evaluateClientMetricsAnomalies', () => {
  it('flags short duration with high engagement', () => {
    const reasons = evaluateClientMetricsAnomalies({
      durationMs: 20_000,
      questionCount: 6,
      callVideoMetrics: { eyeContactPercent: 95, engagementScore: 92 },
    });
    expect(reasons.some((r) => r.includes('short duration with high engagement'))).toBe(true);
  });

  it('flags out-of-range percentages', () => {
    const reasons = evaluateClientMetricsAnomalies({
      durationMs: 600_000,
      questionCount: 6,
      callVideoMetrics: { eyeContactPercent: 140, engagementScore: -5 },
    });
    expect(reasons.some((r) => r.includes('eyeContactPercent out of range'))).toBe(true);
    expect(reasons.some((r) => r.includes('engagementScore out of range'))).toBe(true);
  });

  it('flags zero-variance timeline', () => {
    const timeline = Array.from({ length: 6 }, () => ({
      eyeContactPercent: 88,
      engagementScore: 88,
    }));
    const reasons = evaluateClientMetricsAnomalies({
      durationMs: 600_000,
      questionCount: 6,
      liveVideoMetrics: { timeline },
    });
    expect(reasons.some((r) => r.includes('zero variance'))).toBe(true);
  });

  it('returns empty for plausible metrics', () => {
    const reasons = evaluateClientMetricsAnomalies({
      durationMs: 900_000,
      questionCount: 6,
      callVideoMetrics: { eyeContactPercent: 62, engagementScore: 58 },
      liveAudioHints: { averageVolume: 0.4, silenceRatio: 0.2 },
    });
    expect(reasons).toEqual([]);
  });
});

describe('deterministic fallback narrative assembly', () => {
  it('still produces overall score and hiring band when narrative is fallback-only', () => {
    const snapshot = {
      mode: 'live',
      role: 'Backend Engineer',
      difficulty: 'medium',
      flaggedForReview: false,
      summary: {
        averageConfidenceScore: 40,
        averageEyeContactPercent: 50,
        averageEngagementScore: 45,
      },
      qa: [
        {
          questionId: 'q1',
          question: 'Tell me about a challenge you faced.',
          transcript: '',
        },
      ],
      fullTranscript: [],
      callVoiceMetrics: { wpm: 110, fillerWords: 2, confidenceScore: 40 },
      callVideoMetrics: { eyeContactPercent: 50, engagementScore: 45 },
    };

    const narrative = buildDeterministicFallbackNarrative();
    const assembled = assembleInterviewReport(snapshot, narrative);

    expect(typeof assembled.overallScore).toBe('number');
    expect(assembled.overallScore).toBeGreaterThanOrEqual(0);
    expect(assembled.overallScore).toBeLessThanOrEqual(100);
    expect(assembled.enterpriseReport?.executiveSummary?.summary).toContain(
      NARRATIVE_FALLBACK_SUMMARY.slice(0, 40)
    );
    expect(assembled.enterpriseReport?.hiringRecommendation?.decision).toBeTruthy();
  });
});
