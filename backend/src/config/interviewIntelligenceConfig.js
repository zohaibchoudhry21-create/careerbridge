/**
 * Interview intelligence — token caps and guide generation settings.
 * Used at live-interview create time (baked into Vapi system prompt).
 */

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Max chars of raw resume excerpt in the context brief. */
export const RESUME_EXCERPT_MAX_CHARS = toNumber(
  process.env.INTERVIEW_INTEL_RESUME_EXCERPT_CHARS,
  1200
);

/** Max chars of job description excerpt in the context brief. */
export const JD_EXCERPT_MAX_CHARS = toNumber(process.env.INTERVIEW_INTEL_JD_EXCERPT_CHARS, 800);

/** Max structured skills / projects lines in the brief. */
export const BRIEF_SKILLS_MAX = toNumber(process.env.INTERVIEW_INTEL_SKILLS_MAX, 14);
export const BRIEF_PROJECTS_MAX = toNumber(process.env.INTERVIEW_INTEL_PROJECTS_MAX, 6);

/** Experience / company string caps. */
export const BRIEF_EXPERIENCE_MAX_CHARS = 120;
export const BRIEF_COMPANY_MAX_CHARS = 120;

/** Focus areas included in guide generation. */
export const BRIEF_FOCUS_AREAS_MAX = 6;

/** Groq temperature for question-guide generation. */
export const QUESTION_GUIDE_TEMPERATURE = toNumber(
  process.env.INTERVIEW_INTEL_GUIDE_TEMPERATURE,
  0.45
);

/** Disable Groq guide and use deterministic fallbacks when false. */
export const QUESTION_GUIDE_GROQ_ENABLED =
  String(process.env.INTERVIEW_INTEL_GUIDE_GROQ_ENABLED || 'true').toLowerCase() !== 'false';

/**
 * Allowed focus tags for guide items (map loosely from INTERVIEW_FOCUS_AREAS).
 * Strategies — not hardcoded question banks.
 */
export const GUIDE_FOCUS_TAGS = Object.freeze([
  'opening',
  'behavioral',
  'leadership',
  'system_design',
  'coding',
  'case_study',
  'communication',
  'general',
]);

/** Depth hints for adaptive scaffolding in the guide (model improvises wording). */
export const GUIDE_DEPTH_HINTS = Object.freeze(['warmup', 'standard', 'deep']);

/**
 * Lightweight mid-call depthHint bump/step based on recent answer relevance.
 * Default false — enable via INTERVIEW_INTEL_ADAPTIVE_DEPTH=true after testing.
 */
export const ADAPTIVE_DEPTH_ENABLED =
  String(process.env.INTERVIEW_INTEL_ADAPTIVE_DEPTH || 'false').toLowerCase() === 'true';

/** Min answer length (chars) to treat an on_topic answer as "strong" for depth bumps. */
export const ADAPTIVE_DEPTH_STRONG_MIN_CHARS = toNumber(
  process.env.INTERVIEW_INTEL_ADAPTIVE_STRONG_CHARS,
  120
);
