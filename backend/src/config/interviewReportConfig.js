/**
 * Enterprise interview report scoring weights, hiring bands, and caps.
 */

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Dimension weights for overall / hiring probability (must sum to 1). */
export const DIMENSION_WEIGHTS = Object.freeze({
  communication: 0.16,
  technicalSkills: 0.18,
  behavior: 0.12,
  confidence: 0.12,
  leadership: 0.1,
  problemSolving: 0.16,
  criticalThinking: 0.16,
});

/** Delivery metrics blended into overall (alongside dimensions). */
export const DELIVERY_BLEND_WEIGHTS = Object.freeze({
  dimensions: 0.7,
  voice: 0.15,
  presence: 0.15,
});

/**
 * Phase 3 — hard cap: voice/presence/delivery may raise overall by at most this many points
 * above the content-dimension core, regardless of how high delivery scores are.
 */
export const MAX_DELIVERY_INFLUENCE_ON_OVERALL = 10;

/**
 * When gated per-question average is below this, content dimensions and overall
 * cannot be inflated by delivery / narrative alone.
 * Ceiling formula lives in builders/contentCeiling.js:
 *   avg <= 5 → avg + 1 ; else → avg + avg * 0.3
 */
export const CONTENT_CEILING_THRESHOLD = 20;
/** @deprecated Prefer computeContentScoreCeiling(); kept for re-export compat. */
export const CONTENT_CEILING_PADDING = 1;

/** Hiring probability bands from overall score. */
export const HIRING_BANDS = Object.freeze([
  { min: 85, decision: 'hire', band: 'strong', probabilityBase: 88 },
  { min: 72, decision: 'lean_hire', band: 'promising', probabilityBase: 72 },
  { min: 55, decision: 'hold', band: 'mixed', probabilityBase: 52 },
  { min: 0, decision: 'no_hire', band: 'weak', probabilityBase: 28 },
]);

export const ENTERPRISE_LIST_MAX = toNumber(process.env.INTERVIEW_REPORT_LIST_MAX, 12);
export const LEGACY_LIST_MAX = 10;
export const QUESTION_REVIEW_MAX = toNumber(process.env.INTERVIEW_REPORT_QUESTION_MAX, 10);
export const ROADMAP_MAX = toNumber(process.env.INTERVIEW_REPORT_ROADMAP_MAX, 6);
export const CAREER_SUGGESTIONS_MAX = toNumber(process.env.INTERVIEW_REPORT_CAREER_MAX, 5);
export const TIMELINE_EVENTS_MAX = toNumber(process.env.INTERVIEW_REPORT_TIMELINE_MAX, 60);
export const TRANSCRIPT_PROMPT_MAX_CHARS = toNumber(
  process.env.INTERVIEW_REPORT_TRANSCRIPT_CHARS,
  12000
);

export const STRENGTH_SCORE_THRESHOLD = 70;
export const WEAKNESS_SCORE_THRESHOLD = 55;

export const ENTERPRISE_REPORT_VERSION = 1;

/**
 * Bump when scoring/gate/ceiling logic changes so cached InterviewReport
 * documents are regenerated instead of serving stale scores.
 */
export const SCORING_LOGIC_VERSION = 8;

export const isCurrentScoreVersion = (report) =>
  report != null && Number(report.scoreVersion) === SCORING_LOGIC_VERSION;

export const ENTERPRISE_NARRATIVE_GROQ_ENABLED =
  String(process.env.INTERVIEW_REPORT_GROQ_ENABLED || 'true').toLowerCase() !== 'false';
