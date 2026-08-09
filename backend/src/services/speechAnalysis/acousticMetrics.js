/**
 * Acoustic metrics from client Web Audio samples (RMS / optional pitch).
 * No invented values — null when series is insufficient.
 */

import {
  DEFAULT_AUDIO_SAMPLE_INTERVAL_MS,
  ENERGY_CV_STRESS_HARD,
  ENERGY_CV_STRESS_SOFT,
  LONG_PAUSE_MIN_MS,
  PITCH_CV_STRESS_HARD,
  PITCH_CV_STRESS_SOFT,
  PITCH_MIN_VALID_FRAMES,
  SHORT_PAUSE_MAX_MS,
  SHORT_PAUSE_MIN_MS,
  SILENCE_THRESHOLD,
} from '../../config/speechMonitoringConfig.js';

const clamp100 = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));

const mean = (values) => {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const stdDev = (values) => {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

/** Coefficient of variation; undefined if mean ~0. */
export const coefficientOfVariation = (values = []) => {
  const filtered = values.map(Number).filter((n) => Number.isFinite(n));
  if (filtered.length < 2) return null;
  const m = mean(filtered);
  if (m <= 1e-6) return null;
  return stdDev(filtered) / m;
};

/**
 * Stability score 0–100 from CV (lower CV → higher stability).
 * @param {number|null} cv
 * @param {number} soft
 * @param {number} hard
 */
export const stabilityFromCv = (cv, soft, hard) => {
  if (cv == null || !Number.isFinite(cv)) return null;
  if (cv <= soft) return 100;
  if (cv >= hard) return 0;
  const t = (cv - soft) / (hard - soft);
  return clamp100(100 * (1 - t));
};

export const resolveSampleIntervalMs = (samples, fallbackMs) => {
  if (samples.length >= 2) {
    const a = Number(samples[0].tMs);
    const b = Number(samples[1].tMs);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return b - a;
  }
  return fallbackMs || DEFAULT_AUDIO_SAMPLE_INTERVAL_MS;
};

/**
 * Derive pause events from acoustic samples when client did not send pauseEvents.
 * @param {Array<{ tMs?: number, rms?: number }>} samples
 */
export const derivePauseEventsFromSamples = (samples = [], options = {}) => {
  if (!samples.length) return [];

  const silenceThreshold = options.silenceThreshold ?? SILENCE_THRESHOLD;
  const events = [];
  let silenceStart = null;

  const flush = (endMs) => {
    if (silenceStart == null) return;
    const durationMs = Math.max(0, endMs - silenceStart);
    if (durationMs >= SHORT_PAUSE_MIN_MS) {
      const type =
        durationMs >= LONG_PAUSE_MIN_MS
          ? 'long'
          : durationMs <= SHORT_PAUSE_MAX_MS
            ? 'short'
            : 'short';
      events.push({
        tMs: silenceStart,
        durationMs,
        type,
      });
    }
    silenceStart = null;
  };

  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const tMs = Number(sample.tMs);
    const rms = Number(sample.rms);
    if (!Number.isFinite(tMs)) continue;

    const silent = !Number.isFinite(rms) || rms < silenceThreshold;
    if (silent) {
      if (silenceStart == null) silenceStart = tMs;
    } else {
      flush(tMs);
    }
  }

  const last = samples[samples.length - 1];
  if (silenceStart != null && Number.isFinite(Number(last?.tMs))) {
    flush(Number(last.tMs) + resolveSampleIntervalMs(samples, options.sampleIntervalMs));
  }

  return events;
};

/**
 * @param {object} params
 * @param {Array<{ tMs?: number, rms?: number, pitchHz?: number }>} [params.acousticSamples]
 * @param {Array<{ tMs?: number, durationMs?: number, type?: string }>} [params.pauseEvents]
 * @param {number} [params.sampleIntervalMs]
 * @param {number} [params.averageVolume] legacy hint fallback
 * @param {number} [params.silenceRatio] legacy hint fallback
 * @param {number} [params.longPauseCount] legacy hint fallback
 */
export const computeAcousticMetrics = ({
  acousticSamples = [],
  pauseEvents = [],
  sampleIntervalMs,
  averageVolume,
  silenceRatio,
  longPauseCount,
} = {}) => {
  const samples = Array.isArray(acousticSamples) ? acousticSamples : [];
  const rmsValues = samples
    .map((s) => Number(s.rms))
    .filter((n) => Number.isFinite(n) && n >= 0);

  const pitched = samples
    .map((s) => Number(s.pitchHz))
    .filter((n) => Number.isFinite(n) && n > 0);

  const energy = rmsValues.length
    ? Number(mean(rmsValues).toFixed(4))
    : Number.isFinite(Number(averageVolume))
      ? Number(Number(averageVolume).toFixed(4))
      : null;

  const energyCv = coefficientOfVariation(rmsValues);
  const volumeStability = stabilityFromCv(
    energyCv,
    ENERGY_CV_STRESS_SOFT * 0.5,
    ENERGY_CV_STRESS_HARD
  );

  const pitchCv = pitched.length >= PITCH_MIN_VALID_FRAMES ? coefficientOfVariation(pitched) : null;
  const pitchStability =
    pitched.length >= PITCH_MIN_VALID_FRAMES
      ? stabilityFromCv(pitchCv, PITCH_CV_STRESS_SOFT * 0.5, PITCH_CV_STRESS_HARD)
      : null;

  let events = Array.isArray(pauseEvents) ? [...pauseEvents] : [];
  if (!events.length && samples.length) {
    events = derivePauseEventsFromSamples(samples, { sampleIntervalMs });
  }

  const shortPauses = events.filter((e) => e.type === 'short' || (
    Number(e.durationMs) >= SHORT_PAUSE_MIN_MS && Number(e.durationMs) <= SHORT_PAUSE_MAX_MS
  ));
  const longPauses = events.filter((e) => e.type === 'long' || Number(e.durationMs) >= LONG_PAUSE_MIN_MS);

  const shortPauseCount = shortPauses.length;
  const longPauseCountResolved = longPauses.length || (Number(longPauseCount) > 0 ? Number(longPauseCount) : 0);
  const shortPauseDurationMs = shortPauses.reduce((s, e) => s + (Number(e.durationMs) || 0), 0);
  const longPauseDurationMs = longPauses.reduce((s, e) => s + (Number(e.durationMs) || 0), 0);

  let silenceRatioResolved = Number.isFinite(Number(silenceRatio)) ? Number(silenceRatio) : null;
  if (silenceRatioResolved == null && samples.length) {
    const silent = samples.filter((s) => Number(s.rms) < SILENCE_THRESHOLD).length;
    silenceRatioResolved = Number((silent / samples.length).toFixed(3));
  }

  return {
    energy,
    volumeStability,
    pitchStability,
    energyCv: energyCv == null ? null : Number(energyCv.toFixed(3)),
    pitchCv: pitchCv == null ? null : Number(pitchCv.toFixed(3)),
    pitchedFrameCount: pitched.length,
    sampleCount: samples.length,
    silenceRatio: silenceRatioResolved,
    shortPauseCount,
    longPauseCount: longPauseCountResolved,
    shortPauseDurationMs,
    longPauseDurationMs,
    pauseEvents: events,
  };
};
