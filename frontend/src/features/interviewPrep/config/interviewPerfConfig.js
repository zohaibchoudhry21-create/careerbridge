/**
 * Client-side submit payload shaping (keep in sync with backend caps).
 * Stride reduces wire size while preserving acoustic series for server metrics.
 */

/** Keep every Nth acoustic sample when submitting (1 = no downsample). */
export const SUBMIT_ACOUSTIC_SAMPLE_STRIDE = Math.max(
  1,
  Number(import.meta.env.VITE_INTERVIEW_ACOUSTIC_STRIDE) || 2
);

export const SUBMIT_ACOUSTIC_SAMPLES_MAX = 2400;
export const SUBMIT_PAUSE_EVENTS_MAX = 200;
