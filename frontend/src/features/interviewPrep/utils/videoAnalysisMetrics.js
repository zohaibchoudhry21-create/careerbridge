/**
 * Live video frame aggregation for interview monitoring.
 * Keep in sync with backend/src/utils/videoAnalysisMetrics.js
 *
 * Backward-compatible top-level fields (eyeContactPercent, expressionBreakdown,
 * engagementScore, timeline) are preserved for reports. Professional monitoring
 * metrics live under `behavioralMetrics` + `timelineEvents`.
 */

import {
  DEFAULT_SAMPLE_INTERVAL_MS,
  ENGAGEMENT_SCORE_WEIGHTS,
  EYE_CONTACT_AWAY_THRESHOLD,
  EYE_CONTACT_MAINTAIN_THRESHOLD,
  MULTIPLE_FACE_MIN_COUNT,
  SMILE_EXPRESSION_THRESHOLD,
} from '../config/behavioralMonitoringConfig.js';
import {
  buildBehavioralTimelineEvents,
  buildExpressionTimeline,
  computeAttentionScore,
  computeDistractionScore,
  getDominantExpression,
  isDistractionDetected,
  isSmileSample,
} from './behavioralAnalysisUtils.js';

export { getDominantExpression } from './behavioralAnalysisUtils.js';

/**
 * Engagement blends eye contact with expression tone (report-compatible).
 * Weights live in behavioralMonitoringConfig — do not hardcode call-sites.
 */
export const computeEngagementScore = (eyeContactPercent, expressionBreakdown = {}) => {
  const w = ENGAGEMENT_SCORE_WEIGHTS;
  const eye = Math.min(100, Math.max(0, Number(eyeContactPercent) || 0));

  const happy = Number(expressionBreakdown.happy) || 0;
  const neutral = Number(expressionBreakdown.neutral) || 0;
  const sad = Number(expressionBreakdown.sad) || 0;
  const fearful = Number(expressionBreakdown.fearful) || 0;

  const positiveBalance = Math.min(1, happy * w.positiveHappy + neutral * w.positiveNeutral);
  const negativeBalance = Math.min(1, sad + fearful);

  const expressionComponent = Math.round(
    positiveBalance * 100 * w.expressionPositiveShare +
      (1 - negativeBalance) * 100 * w.expressionNegativeShare
  );
  const score = Math.round(eye * w.eyeContact + expressionComponent * w.expressionComponent);

  return Math.min(100, Math.max(0, score));
};

const resolveSampleIntervalMs = (samples, fallbackMs) => {
  if (samples.length >= 2) {
    const a = Number(samples[0].tMs);
    const b = Number(samples[1].tMs);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return b - a;
  }
  return fallbackMs || DEFAULT_SAMPLE_INTERVAL_MS;
};

const sampleDurationMs = (sample, index, samples, intervalMs) => {
  const t = Number(sample.tMs);
  const next = samples[index + 1];
  if (Number.isFinite(t) && next && Number.isFinite(Number(next.tMs))) {
    const delta = Number(next.tMs) - t;
    if (delta > 0) return delta;
  }
  return intervalMs;
};

const emptyBehavioralMetrics = () => ({
  eyeContactPercent: 0,
  headPose: {
    avgYaw: 0,
    avgPitch: 0,
    lookingLeftPercent: 0,
    lookingRightPercent: 0,
    lookingDownPercent: 0,
    lookingCenterPercent: 0,
  },
  lookingAwayDurationMs: 0,
  lookingAwayPercent: 0,
  cameraFocusScore: null,
  cameraFocusAssumptions:
    'Proxy from face detection confidence + bounding-box area ratio (not optical blur).',
  multipleFaceSampleCount: 0,
  multipleFacePercent: 0,
  strangerSampleCount: 0,
  strangerPercent: 0,
  strangerDetectionEnabled: false,
  strangerDetectionMethod:
    'face-api FaceRecognitionNet descriptor distance vs first stable candidate reference',
  faceMissingDurationMs: 0,
  faceMissingPercent: 0,
  candidateLeftCameraEventCount: 0,
  smileCount: 0,
  smileFrequencyPerMinute: 0,
  smilePercent: 0,
  expressionTimeline: [],
  attentionScore: 0,
  engagementScore: 0,
  distractionScore: 0,
  distractionDetected: false,
});

/**
 * @param {Array<Record<string, unknown>>} samples
 * @param {{ sampleIntervalMs?: number }} [options]
 */
export const aggregateVideoFrameSamples = (samples = [], options = {}) => {
  if (!samples.length) {
    return {
      sampleCount: 0,
      eyeContactPercent: 0,
      expressionBreakdown: {},
      engagementScore: 0,
      attentionScore: 0,
      timeline: [],
      behavioralMetrics: emptyBehavioralMetrics(),
      timelineEvents: [],
    };
  }

  const intervalMs = resolveSampleIntervalMs(samples, options.sampleIntervalMs);
  const count = samples.length;

  let eyeSum = 0;
  let yawSum = 0;
  let pitchSum = 0;
  let poseCount = 0;
  let focusSum = 0;
  let focusCount = 0;
  let lookingAwayMs = 0;
  let faceMissingMs = 0;
  let totalDurationMs = 0;
  let lookingLeft = 0;
  let lookingRight = 0;
  let lookingDown = 0;
  let lookingCenter = 0;
  let multipleFaceSamples = 0;
  let strangerSamples = 0;
  let strangerComparisons = 0;
  let smileCount = 0;
  let facePresentSamples = 0;
  let forwardPoseSamples = 0;
  let lookingOffCenter = 0;
  let strangerDetectionEnabled = false;

  const expressionTotals = {};

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const dur = sampleDurationMs(sample, i, samples, intervalMs);
    totalDurationMs += dur;

    const eye = Number(sample.eyeContactPercent) || 0;
    eyeSum += eye;

    const faceCount = Number(sample.faceCount);
    const hasFace =
      (Number.isFinite(faceCount) ? faceCount > 0 : eye > 0) ||
      Boolean(sample.expressions && Object.keys(sample.expressions).length);

    const faceCountKnown = Number.isFinite(faceCount);
    const faces = faceCountKnown ? faceCount : hasFace ? 1 : 0;

    if (faces <= 0) {
      faceMissingMs += dur;
    } else {
      facePresentSamples += 1;
    }

    if (faces >= MULTIPLE_FACE_MIN_COUNT) multipleFaceSamples += 1;

    if (sample.strangerDetectionEnabled) strangerDetectionEnabled = true;
    if (sample.isPrimaryMatch === true || sample.isPrimaryMatch === false) {
      strangerComparisons += 1;
      if (sample.isPrimaryMatch === false) strangerSamples += 1;
    }

    const direction = sample.lookingDirection;
    if (direction === 'left') {
      lookingLeft += 1;
      lookingOffCenter += 1;
    } else if (direction === 'right') {
      lookingRight += 1;
      lookingOffCenter += 1;
    } else if (direction === 'down') {
      lookingDown += 1;
      lookingOffCenter += 1;
    } else if (direction === 'center') {
      lookingCenter += 1;
      forwardPoseSamples += 1;
    } else if (direction === 'away') {
      lookingOffCenter += 1;
    }

    const isAway =
      sample.isLookingAway === true ||
      direction === 'away' ||
      direction === 'left' ||
      direction === 'right' ||
      direction === 'down' ||
      eye < EYE_CONTACT_AWAY_THRESHOLD;

    if (faces > 0 && isAway) lookingAwayMs += dur;

    if (sample.headPose && Number.isFinite(Number(sample.headPose.yaw))) {
      yawSum += Number(sample.headPose.yaw);
      pitchSum += Number(sample.headPose.pitch) || 0;
      poseCount += 1;
    }

    const focusRaw = sample.cameraFocusScore;
    if (focusRaw != null && Number.isFinite(Number(focusRaw))) {
      focusSum += Number(focusRaw);
      focusCount += 1;
    }

    const expressions = sample.expressions || {};
    for (const [key, value] of Object.entries(expressions)) {
      expressionTotals[key] = (expressionTotals[key] || 0) + Number(value);
    }

    if (isSmileSample(expressions, SMILE_EXPRESSION_THRESHOLD) || sample.isSmiling === true) {
      smileCount += 1;
    }
  }

  const eyeContactPercent = Math.round(eyeSum / count);

  const expressionBreakdown = Object.fromEntries(
    Object.entries(expressionTotals).map(([key, total]) => [
      key,
      Number((total / count).toFixed(3)),
    ])
  );

  const engagementScore = computeEngagementScore(eyeContactPercent, expressionBreakdown);

  const lookingAwayPercent = totalDurationMs
    ? Math.round((lookingAwayMs / totalDurationMs) * 100)
    : 0;
  const faceMissingPercent = totalDurationMs
    ? Math.round((faceMissingMs / totalDurationMs) * 100)
    : 0;
  const multipleFacePercent = Math.round((multipleFaceSamples / count) * 100);
  const strangerPercent = strangerComparisons
    ? Math.round((strangerSamples / strangerComparisons) * 100)
    : 0;
  const lookingLeftPercent = Math.round((lookingLeft / count) * 100);
  const lookingRightPercent = Math.round((lookingRight / count) * 100);
  const lookingDownPercent = Math.round((lookingDown / count) * 100);
  const lookingCenterPercent = Math.round((lookingCenter / count) * 100);
  const lookingOffCenterPercent = Math.round((lookingOffCenter / count) * 100);
  const facePresencePercent = Math.round((facePresentSamples / count) * 100);
  const forwardPosePercent = Math.round((forwardPoseSamples / count) * 100);
  const notLookingAwayPercent = Math.max(0, 100 - lookingAwayPercent);
  const cameraFocusScore = focusCount ? Math.round(focusSum / focusCount) : null;
  const smilePercent = Math.round((smileCount / count) * 100);
  const durationMinutes = totalDurationMs > 0 ? totalDurationMs / 60000 : 0;
  const smileFrequencyPerMinute =
    durationMinutes > 0 ? Number((smileCount / durationMinutes).toFixed(2)) : 0;

  const attentionScore = computeAttentionScore({
    eyeContactPercent,
    notLookingAwayPercent,
    cameraFocusScore: cameraFocusScore ?? 0,
    facePresencePercent,
    forwardPosePercent,
  });

  const distractionScore = computeDistractionScore({
    lookingAwayPercent,
    lookingOffCenterPercent,
    multipleFacePercent,
    faceMissingPercent,
    strangerPercent,
  });

  const timelineEvents = buildBehavioralTimelineEvents(samples, { sampleIntervalMs: intervalMs });
  const expressionTimeline = buildExpressionTimeline(samples, { sampleIntervalMs: intervalMs });
  const candidateLeftCameraEventCount = timelineEvents.filter(
    (e) => e.type === 'CANDIDATE_LEFT_CAMERA'
  ).length;

  const behavioralMetrics = {
    eyeContactPercent,
    headPose: {
      avgYaw: poseCount ? Number((yawSum / poseCount).toFixed(4)) : 0,
      avgPitch: poseCount ? Number((pitchSum / poseCount).toFixed(4)) : 0,
      lookingLeftPercent,
      lookingRightPercent,
      lookingDownPercent,
      lookingCenterPercent,
    },
    lookingAwayDurationMs: Math.round(lookingAwayMs),
    lookingAwayPercent,
    cameraFocusScore,
    cameraFocusAssumptions:
      'Proxy from face detection confidence + bounding-box area ratio (not optical blur).',
    multipleFaceSampleCount: multipleFaceSamples,
    multipleFacePercent,
    strangerSampleCount: strangerSamples,
    strangerPercent,
    strangerDetectionEnabled,
    strangerDetectionMethod:
      'face-api FaceRecognitionNet descriptor distance vs first stable candidate reference',
    faceMissingDurationMs: Math.round(faceMissingMs),
    faceMissingPercent,
    candidateLeftCameraEventCount,
    smileCount,
    smileFrequencyPerMinute,
    smilePercent,
    expressionTimeline,
    attentionScore,
    engagementScore,
    distractionScore,
    distractionDetected: isDistractionDetected(distractionScore),
    maintainEyeContactPercent: Math.round(
      (samples.filter((s) => (Number(s.eyeContactPercent) || 0) >= EYE_CONTACT_MAINTAIN_THRESHOLD)
        .length /
        count) *
        100
    ),
    sampleIntervalMs: intervalMs,
    totalDurationMs: Math.round(totalDurationMs),
  };

  const timeline = samples.slice(-12).map((sample, index) => ({
    t: index,
    eyeContactPercent: sample.eyeContactPercent ?? 0,
    dominantExpression: getDominantExpression(sample.expressions),
  }));

  return {
    sampleCount: count,
    eyeContactPercent,
    expressionBreakdown,
    engagementScore,
    attentionScore,
    timeline,
    behavioralMetrics,
    timelineEvents,
  };
};
