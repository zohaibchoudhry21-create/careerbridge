/**
 * Thresholds for live speech acoustic capture.
 * Keep in sync with backend/src/config/speechMonitoringConfig.js
 *
 * Acoustic metrics come from Web Audio samples — never invent pitch/energy.
 */

/** RMS / amplitude below this counts as silence (0–1 normalized). */
export const SILENCE_THRESHOLD = 0.04;

/** Pause classification (ms of continuous silence). */
export const SHORT_PAUSE_MIN_MS = 300;
export const SHORT_PAUSE_MAX_MS = 1199;
export const LONG_PAUSE_MIN_MS = 1200;

/** Pitch detection bounds (Hz) — typical adult speech. */
export const PITCH_MIN_HZ = 70;
export const PITCH_MAX_HZ = 400;

/** Cap acoustic samples stored / submitted. */
export const ACOUSTIC_SAMPLES_MAX = 2400;
/** Cap pause events on the client snapshot. */
export const PAUSE_EVENTS_MAX = 200;

/** Autocorrelation clarity (0–1) below this → omit pitch for the frame. */
export const PITCH_CLARITY_MIN = 0.35;
