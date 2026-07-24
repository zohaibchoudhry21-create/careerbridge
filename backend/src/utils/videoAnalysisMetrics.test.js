import { describe, expect, it } from 'vitest';
import { aggregateVideoFrameSamples, computeEngagementScore } from './videoAnalysisMetrics.js';

describe('computeEngagementScore', () => {
  it('blends eye contact and expression breakdown into 0–100', () => {
    const score = computeEngagementScore(75, { happy: 0.5, neutral: 0.4, sad: 0.05 });
    expect(score).toBe(69);
  });

  it('clamps eye contact and still applies expression component when breakdown is empty', () => {
    expect(computeEngagementScore(-10, {})).toBe(14);
    expect(computeEngagementScore(0, {})).toBe(14);
  });
});

describe('aggregateVideoFrameSamples', () => {
  it('averages samples and derives engagement', () => {
    const samples = [
      { eyeContactPercent: 80, expressions: { happy: 0.6, neutral: 0.3 } },
      { eyeContactPercent: 70, expressions: { happy: 0.4, neutral: 0.5, sad: 0.1 } },
    ];

    const aggregated = aggregateVideoFrameSamples(samples);
    expect(aggregated.sampleCount).toBe(2);
    expect(aggregated.eyeContactPercent).toBe(75);
    expect(aggregated.engagementScore).toBe(computeEngagementScore(75, aggregated.expressionBreakdown));
    expect(aggregated.timeline).toHaveLength(2);
  });

  it('returns zeros for an empty sample list', () => {
    expect(aggregateVideoFrameSamples([])).toMatchObject({
      sampleCount: 0,
      eyeContactPercent: 0,
      engagementScore: 0,
      timeline: [],
    });
  });
});
