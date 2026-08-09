import { describe, expect, it } from 'vitest';
import {
  aggregateVideoFrameSamples,
  computeEngagementScore,
} from './videoAnalysisMetrics.js';
import {
  buildBehavioralTimelineEvents,
  computeAttentionScore,
  computeDistractionScore,
  formatOffsetLabel,
  isDistractionDetected,
} from './behavioralAnalysisUtils.js';
import {
  classifyLookingDirection,
  computeCameraFocusHeuristic,
} from './headPoseUtils.js';

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
  it('averages samples and derives engagement (backward compatible)', () => {
    const samples = [
      { eyeContactPercent: 80, expressions: { happy: 0.6, neutral: 0.3 } },
      { eyeContactPercent: 70, expressions: { happy: 0.4, neutral: 0.5, sad: 0.1 } },
    ];

    const aggregated = aggregateVideoFrameSamples(samples);
    expect(aggregated.sampleCount).toBe(2);
    expect(aggregated.eyeContactPercent).toBe(75);
    expect(aggregated.engagementScore).toBe(
      computeEngagementScore(75, aggregated.expressionBreakdown)
    );
    expect(aggregated.timeline).toHaveLength(2);
  });

  it('returns zeros for an empty sample list', () => {
    expect(aggregateVideoFrameSamples([])).toMatchObject({
      sampleCount: 0,
      eyeContactPercent: 0,
      engagementScore: 0,
      timeline: [],
      timelineEvents: [],
    });
    expect(aggregatedEmptyHasBehavioral(aggregateVideoFrameSamples([]))).toBe(true);
  });

  it('computes looking-away duration, smile stats, and composed scores from rich samples', () => {
    const samples = [
      {
        tMs: 0,
        eyeContactPercent: 80,
        expressions: { happy: 0.7, neutral: 0.2 },
        faceCount: 1,
        lookingDirection: 'center',
        isLookingAway: false,
        isSmiling: true,
        cameraFocusScore: 80,
        headPose: { yaw: 0.01, pitch: 0.4 },
        strangerDetectionEnabled: true,
        isPrimaryMatch: true,
      },
      {
        tMs: 400,
        eyeContactPercent: 20,
        expressions: { neutral: 0.8 },
        faceCount: 1,
        lookingDirection: 'left',
        isLookingAway: true,
        isSmiling: false,
        cameraFocusScore: 70,
        headPose: { yaw: -0.5, pitch: 0.4 },
        strangerDetectionEnabled: true,
        isPrimaryMatch: true,
      },
      {
        tMs: 800,
        eyeContactPercent: 0,
        expressions: { neutral: 1 },
        faceCount: 0,
        lookingDirection: 'none',
        isLookingAway: true,
        cameraFocusScore: null,
      },
      {
        tMs: 1200,
        eyeContactPercent: 50,
        expressions: { happy: 0.6 },
        faceCount: 2,
        lookingDirection: 'center',
        isLookingAway: false,
        isSmiling: true,
        cameraFocusScore: 60,
        strangerDetectionEnabled: true,
        isPrimaryMatch: false,
      },
    ];

    const aggregated = aggregateVideoFrameSamples(samples, { sampleIntervalMs: 400 });
    const bm = aggregated.behavioralMetrics;

    expect(bm.lookingAwayDurationMs).toBeGreaterThan(0);
    expect(bm.headPose.lookingLeftPercent).toBe(25);
    expect(bm.multipleFaceSampleCount).toBe(1);
    expect(bm.smileCount).toBe(2);
    expect(bm.strangerDetectionEnabled).toBe(true);
    expect(bm.strangerSampleCount).toBe(1);
    expect(bm.cameraFocusScore).toBe(70);
    expect(aggregated.attentionScore).toBe(bm.attentionScore);
    expect(typeof bm.distractionScore).toBe('number');
    expect(Array.isArray(aggregated.timelineEvents)).toBe(true);
    expect(Array.isArray(bm.expressionTimeline)).toBe(true);
  });

  it('accepts legacy samples without faceCount / lookingDirection', () => {
    const aggregated = aggregateVideoFrameSamples([
      { eyeContactPercent: 90, expressions: { happy: 0.5 } },
      { eyeContactPercent: 30, expressions: { sad: 0.4, neutral: 0.5 } },
    ]);
    expect(aggregated.sampleCount).toBe(2);
    expect(aggregated.behavioralMetrics.lookingAwayDurationMs).toBeGreaterThan(0);
    expect(aggregated.engagementScore).toBeGreaterThan(0);
  });
});

function aggregatedEmptyHasBehavioral(result) {
  return Boolean(result.behavioralMetrics) && Array.isArray(result.timelineEvents);
}

describe('behavioral timeline + scores', () => {
  it('formats offset labels as mm:ss', () => {
    expect(formatOffsetLabel(0)).toBe('00:00');
    expect(formatOffsetLabel(15_000)).toBe('00:15');
    expect(formatOffsetLabel(90_000)).toBe('01:30');
  });

  it('emits throttled looking-away / multi-face / left-camera events', () => {
    const samples = [];
    // Maintain eye contact
    for (let i = 0; i < 5; i += 1) {
      samples.push({
        tMs: i * 400,
        eyeContactPercent: 80,
        faceCount: 1,
        lookingDirection: 'center',
        expressions: { neutral: 0.9 },
      });
    }
    // Looking away
    for (let i = 5; i < 12; i += 1) {
      samples.push({
        tMs: i * 400,
        eyeContactPercent: 20,
        faceCount: 1,
        lookingDirection: 'away',
        expressions: { neutral: 0.9 },
      });
    }
    // Another face
    samples.push({
      tMs: 5000,
      eyeContactPercent: 60,
      faceCount: 2,
      lookingDirection: 'center',
      expressions: { neutral: 0.8 },
    });
    // Leave camera for > 5s
    for (let i = 0; i < 15; i += 1) {
      samples.push({
        tMs: 5600 + i * 400,
        eyeContactPercent: 0,
        faceCount: 0,
        lookingDirection: 'none',
        expressions: { neutral: 1 },
      });
    }

    const events = buildBehavioralTimelineEvents(samples, { sampleIntervalMs: 400 });
    const types = events.map((e) => e.type);

    expect(types).toContain('EYE_CONTACT');
    expect(types).toContain('LOOKING_AWAY');
    expect(types).toContain('MULTIPLE_FACES');
    expect(types).toContain('FACE_MISSING');
    expect(types).toContain('CANDIDATE_LEFT_CAMERA');

    const left = events.find((e) => e.type === 'CANDIDATE_LEFT_CAMERA');
    expect(left.message).toBe('Candidate left camera');
    expect(left.offsetLabel).toMatch(/^\d{2}:\d{2}$/);
  });

  it('composes attention and distraction from measured parts', () => {
    const attention = computeAttentionScore({
      eyeContactPercent: 80,
      notLookingAwayPercent: 90,
      cameraFocusScore: 70,
      facePresencePercent: 100,
      forwardPosePercent: 85,
    });
    expect(attention).toBeGreaterThan(70);
    expect(attention).toBeLessThanOrEqual(100);

    const distraction = computeDistractionScore({
      lookingAwayPercent: 50,
      lookingOffCenterPercent: 40,
      multipleFacePercent: 10,
      faceMissingPercent: 5,
      strangerPercent: 0,
    });
    expect(distraction).toBeGreaterThan(20);
    expect(typeof isDistractionDetected(distraction)).toBe('boolean');
  });
});

describe('head pose / camera focus', () => {
  it('classifies looking directions from yaw/pitch', () => {
    expect(classifyLookingDirection({ yaw: -0.5, pitch: 0.4 }, { faceCount: 1 })).toBe('left');
    expect(classifyLookingDirection({ yaw: 0.5, pitch: 0.4 }, { faceCount: 1 })).toBe('right');
    expect(classifyLookingDirection({ yaw: 0, pitch: 0.8 }, { faceCount: 1 })).toBe('down');
    expect(
      classifyLookingDirection({ yaw: 0, pitch: 0.4 }, { faceCount: 1, eyeContactPercent: 80 })
    ).toBe('center');
    expect(classifyLookingDirection(null, { faceCount: 0 })).toBe('none');
  });

  it('computes camera-focus heuristic from measurable score + size', () => {
    const focused = computeCameraFocusHeuristic({
      detectionScore: 0.9,
      faceAreaRatio: 0.12,
      faceCount: 1,
    });
    const distant = computeCameraFocusHeuristic({
      detectionScore: 0.3,
      faceAreaRatio: 0.01,
      faceCount: 1,
    });
    expect(focused).toBeGreaterThan(distant);
    expect(computeCameraFocusHeuristic({ faceCount: 0 })).toBeNull();
  });
});
