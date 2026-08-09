/**
 * Production performance / payload / validation caps for interview flows.
 * Does not change scoring formulas — only transport, concurrency, and storage shape.
 */

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Max acoustic samples accepted on submit (aligned with FE ACOUSTIC_SAMPLES_MAX). */
export const SUBMIT_ACOUSTIC_SAMPLES_MAX = toNumber(
  process.env.INTERVIEW_SUBMIT_ACOUSTIC_SAMPLES_MAX,
  2400
);

/** Max pause events on submit. */
export const SUBMIT_PAUSE_EVENTS_MAX = toNumber(process.env.INTERVIEW_SUBMIT_PAUSE_EVENTS_MAX, 200);

/** Max behavioral/speech timeline events persisted on session video metrics. */
export const PERSIST_TIMELINE_EVENTS_MAX = toNumber(
  process.env.INTERVIEW_PERSIST_TIMELINE_EVENTS_MAX,
  80
);

/** Max pause events persisted on callLiveAudioHints. */
export const PERSIST_PAUSE_EVENTS_MAX = toNumber(process.env.INTERVIEW_PERSIST_PAUSE_EVENTS_MAX, 80);

/** Structured stage logging for interview pipelines. */
export const INTERVIEW_PERF_LOG_ENABLED =
  String(process.env.INTERVIEW_PERF_LOG_ENABLED || 'true').toLowerCase() !== 'false';

/** In-process TTL for role suggestion Groq results (ms). */
export const ROLE_SUGGESTIONS_CACHE_TTL_MS = toNumber(
  process.env.INTERVIEW_ROLE_SUGGESTIONS_CACHE_TTL_MS,
  120_000
);

/** In-process TTL for resume analysis Groq results (ms). */
export const RESUME_ANALYSIS_CACHE_TTL_MS = toNumber(
  process.env.INTERVIEW_RESUME_ANALYSIS_CACHE_TTL_MS,
  300_000
);
