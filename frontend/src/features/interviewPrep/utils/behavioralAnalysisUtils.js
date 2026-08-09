/**
 * Behavioral timeline event generation + score composition.
 * Keep in sync with backend/src/utils/behavioralAnalysisUtils.js
 */

import {
  ATTENTION_SCORE_WEIGHTS,
  CANDIDATE_LEFT_CAMERA_MS,
  DEFAULT_SAMPLE_INTERVAL_MS,
  DISTRACTION_FLAG_THRESHOLD,
  DISTRACTION_SCORE_WEIGHTS,
  EYE_CONTACT_AWAY_THRESHOLD,
  EYE_CONTACT_MAINTAIN_THRESHOLD,
  EXPRESSION_TIMELINE_MAX,
  EXPRESSION_TIMELINE_MIN_HOLD_MS,
  FACE_MISSING_EVENT_MS,
  MULTIPLE_FACE_MIN_COUNT,
  SMILE_EXPRESSION_THRESHOLD,
  TIMELINE_EVENTS_MAX,
  TIMELINE_EVENT_MIN_HOLD_MS,
  TIMELINE_EVENT_THROTTLE_MS,
} from '../config/behavioralMonitoringConfig.js';

export const formatOffsetLabel = (tMs = 0) => {
  const totalSec = Math.max(0, Math.floor(Number(tMs) / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export const getDominantExpression = (expressions = {}) => {
  const entries = Object.entries(expressions || {});
  if (!entries.length) return 'neutral';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
};

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));
const clamp100 = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));

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

/**
 * Build throttled behavioral timeline events from ordered samples.
 */
export const buildBehavioralTimelineEvents = (samples = [], options = {}) => {
  if (!samples.length) return [];

  const intervalMs = resolveSampleIntervalMs(samples, options.sampleIntervalMs);
  const events = [];
  const lastEmittedAt = {};

  let holdType = null;
  let holdSinceMs = 0;
  let holdEmitted = false;
  let noFaceStreakMs = 0;
  let emittedFaceMissing = false;
  let emittedLeftCamera = false;

  const tryEmit = (type, tMs, message, severity = 'info') => {
    const last = lastEmittedAt[type];
    if (Number.isFinite(last) && tMs - last < TIMELINE_EVENT_THROTTLE_MS) return false;
    lastEmittedAt[type] = tMs;
    events.push({
      tMs,
      offsetLabel: formatOffsetLabel(tMs),
      type,
      message,
      severity,
    });
    return true;
  };

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const tMs = Number.isFinite(Number(sample.tMs)) ? Number(sample.tMs) : i * intervalMs;
    const dur = sampleDurationMs(sample, i, samples, intervalMs);
    const faceCount = Number(sample.faceCount) || 0;
    const eye = Number(sample.eyeContactPercent) || 0;
    const direction = sample.lookingDirection || 'none';

    if (faceCount <= 0) {
      noFaceStreakMs += dur;
      if (!emittedFaceMissing && noFaceStreakMs >= FACE_MISSING_EVENT_MS) {
        tryEmit('FACE_MISSING', tMs, 'Face missing from camera', 'warning');
        emittedFaceMissing = true;
      }
      if (!emittedLeftCamera && noFaceStreakMs >= CANDIDATE_LEFT_CAMERA_MS) {
        tryEmit('CANDIDATE_LEFT_CAMERA', tMs, 'Candidate left camera', 'critical');
        emittedLeftCamera = true;
      }
      holdType = 'none';
      holdSinceMs = tMs;
      holdEmitted = false;
      continue;
    }

    noFaceStreakMs = 0;
    emittedFaceMissing = false;
    emittedLeftCamera = false;

    if (faceCount >= MULTIPLE_FACE_MIN_COUNT) {
      tryEmit('MULTIPLE_FACES', tMs, 'Another face detected', 'warning');
    }

    if (sample.isPrimaryMatch === false) {
      tryEmit('STRANGER_DETECTED', tMs, 'Unrecognized face near candidate reference', 'warning');
    }

    let nextHold = null;
    let holdMessage = null;
    let holdSeverity = 'info';

    if (direction === 'left') {
      nextHold = 'LOOKING_LEFT';
      holdMessage = 'Looking left';
      holdSeverity = 'warning';
    } else if (direction === 'right') {
      nextHold = 'LOOKING_RIGHT';
      holdMessage = 'Looking right';
      holdSeverity = 'warning';
    } else if (direction === 'down') {
      nextHold = 'LOOKING_DOWN';
      holdMessage = 'Looking down';
      holdSeverity = 'warning';
    } else if (
      direction === 'away' ||
      sample.isLookingAway === true ||
      eye < EYE_CONTACT_AWAY_THRESHOLD
    ) {
      nextHold = 'LOOKING_AWAY';
      holdMessage = 'Looking away';
      holdSeverity = 'warning';
    } else if (eye >= EYE_CONTACT_MAINTAIN_THRESHOLD && direction === 'center') {
      nextHold = 'EYE_CONTACT';
      holdMessage = 'Maintaining eye contact';
      holdSeverity = 'info';
    }

    if (nextHold !== holdType) {
      holdType = nextHold;
      holdSinceMs = tMs;
      holdEmitted = false;
    } else if (nextHold && !holdEmitted && tMs - holdSinceMs >= TIMELINE_EVENT_MIN_HOLD_MS) {
      holdEmitted = Boolean(tryEmit(nextHold, holdSinceMs, holdMessage, holdSeverity));
    }
  }

  return events.slice(0, TIMELINE_EVENTS_MAX);
};

export const buildExpressionTimeline = (samples = [], options = {}) => {
  if (!samples.length) return [];

  const intervalMs = resolveSampleIntervalMs(samples, options.sampleIntervalMs);
  const points = [];
  let lastExpression = null;
  let lastAt = -Infinity;

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const tMs = Number.isFinite(Number(sample.tMs)) ? Number(sample.tMs) : i * intervalMs;
    const expressions = sample.expressions || {};
    const dominant = sample.dominantExpression || getDominantExpression(expressions);
    const confidence = Number(expressions[dominant]) || 0;

    if (dominant !== lastExpression && tMs - lastAt >= EXPRESSION_TIMELINE_MIN_HOLD_MS) {
      points.push({
        tMs,
        offsetLabel: formatOffsetLabel(tMs),
        expression: dominant,
        confidence: Number(confidence.toFixed(3)),
      });
      lastExpression = dominant;
      lastAt = tMs;
      if (points.length >= EXPRESSION_TIMELINE_MAX) break;
    }
  }

  return points;
};

export const computeAttentionScore = (parts = {}) => {
  const w = ATTENTION_SCORE_WEIGHTS;
  const score =
    clamp01(parts.eyeContactPercent / 100) * w.eyeContact * 100 +
    clamp01(parts.notLookingAwayPercent / 100) * w.notLookingAway * 100 +
    clamp01(parts.cameraFocusScore / 100) * w.cameraFocus * 100 +
    clamp01(parts.facePresencePercent / 100) * w.facePresence * 100 +
    clamp01(parts.forwardPosePercent / 100) * w.forwardPose * 100;

  return clamp100(score);
};

export const computeDistractionScore = (parts = {}) => {
  const w = DISTRACTION_SCORE_WEIGHTS;
  const score =
    clamp01(parts.lookingAwayPercent / 100) * w.lookingAway * 100 +
    clamp01(parts.lookingOffCenterPercent / 100) * w.lookingOffCenter * 100 +
    clamp01(parts.multipleFacePercent / 100) * w.multipleFaces * 100 +
    clamp01(parts.faceMissingPercent / 100) * w.faceMissing * 100 +
    clamp01(parts.strangerPercent / 100) * w.stranger * 100;

  return clamp100(score);
};

export const isDistractionDetected = (distractionScore) =>
  Number(distractionScore) >= DISTRACTION_FLAG_THRESHOLD;

export const isSmileSample = (expressions = {}, threshold = SMILE_EXPRESSION_THRESHOLD) =>
  Number(expressions.happy) >= threshold;
