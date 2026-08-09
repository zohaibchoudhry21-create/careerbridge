import {
  ENTERPRISE_LIST_MAX,
  STRENGTH_SCORE_THRESHOLD,
  WEAKNESS_SCORE_THRESHOLD,
} from '../../../config/interviewReportConfig.js';

/** Overall below this → drop all AI strengths (and delivery praise). */
const LOW_OVERALL_STRENGTH_BLOCK = 15;

/**
 * Phase 6 — dimension score below this → AI "strength" strings that mention
 * the dimension (or synonyms) are removed from strengths and moved to weaknesses.
 */
export const WEAK_DIM_STRENGTH_THRESHOLD = 20;

/** Keyword / synonym matchers per dimension (lowercase substrings). */
export const DIMENSION_STRENGTH_KEYWORDS = Object.freeze({
  communication: [
    'communication',
    'communicat',
    'articulate',
    'articulation',
    'clarity',
    'clear spoken',
    'spoken delivery',
    'verbal',
  ],
  technicalSkills: [
    'technical skill',
    'technical',
    'engineering',
    'coding',
    'implementation',
    'system design',
  ],
  behavior: ['behavior', 'behaviour', 'professionalism', 'presence', 'engagement'],
  confidence: ['confidence', 'confident', 'assertive'],
  leadership: ['leadership', 'ownership', 'initiative', 'mentorship'],
  problemSolving: ['problem solving', 'problem-solving', 'debugging', 'troubleshoot'],
  criticalThinking: ['critical thinking', 'critical-thinking', 'analytical', 'reasoning'],
});

const pushUnique = (list, item, max) => {
  const text = String(item || '').trim();
  if (!text || list.includes(text)) return;
  if (list.length < max) list.push(text);
};

export const listWeakDimensionsForStrengthFilter = (
  dimensions = {},
  threshold = WEAK_DIM_STRENGTH_THRESHOLD
) =>
  Object.entries(dimensions)
    .filter(([, dim]) => dim?.score != null && Number(dim.score) < threshold)
    .map(([key, dim]) => ({
      key,
      label: dim.label || key,
      score: Number(dim.score),
      keywords: DIMENSION_STRENGTH_KEYWORDS[key] || [String(dim.label || key).toLowerCase()],
    }));

/**
 * If strength text references a weak dimension, return that dim meta; else null.
 */
export const strengthReferencesWeakDimension = (strengthText, weakDims = []) => {
  const lower = String(strengthText || '')
    .trim()
    .toLowerCase();
  if (!lower || !weakDims.length) return null;
  for (const dim of weakDims) {
    if ((dim.keywords || []).some((k) => k && lower.includes(k))) return dim;
  }
  return null;
};

/**
 * Phase 6 consistency filter for AI strengths.
 * Returns { keep, moved } where moved entries become weakness lines.
 */
export const filterNarrativeStrengths = (narrativeStrengths = [], dimensions = {}) => {
  const weakDims = listWeakDimensionsForStrengthFilter(dimensions);
  const keep = [];
  const moved = [];

  for (const raw of narrativeStrengths || []) {
    const text = String(raw || '').trim();
    if (!text) continue;
    const hit = strengthReferencesWeakDimension(text, weakDims);
    if (hit) {
      moved.push(
        `${hit.label} needs substantial improvement (${hit.score}/100) — not a demonstrated strength.`
      );
    } else {
      keep.push(text);
    }
  }

  return { keep, moved };
};

export const buildStrengthsWeaknesses = ({
  dimensions = {},
  voiceSection,
  eyeContactSection,
  bodyLanguageSection,
  narrative = {},
  overallScore = null,
  contentCeilingApplied = false,
} = {}) => {
  const strengths = [];
  const weaknesses = [];
  const improvementAreas = [];
  const blockAiStrengths =
    contentCeilingApplied ||
    (overallScore != null && Number(overallScore) < LOW_OVERALL_STRENGTH_BLOCK);

  for (const [, dim] of Object.entries(dimensions)) {
    if (dim?.score == null) continue;
    if (dim.score >= STRENGTH_SCORE_THRESHOLD) {
      pushUnique(strengths, `Strong ${dim.label.toLowerCase()} (${dim.score}/100)`, ENTERPRISE_LIST_MAX);
    } else if (dim.score < WEAKNESS_SCORE_THRESHOLD) {
      pushUnique(weaknesses, `${dim.label} needs work (${dim.score}/100)`, ENTERPRISE_LIST_MAX);
      pushUnique(
        improvementAreas,
        `Improve ${dim.label.toLowerCase()} with targeted practice`,
        ENTERPRISE_LIST_MAX
      );
    }
  }

  if (
    !blockAiStrengths &&
    voiceSection?.score != null &&
    voiceSection.score >= STRENGTH_SCORE_THRESHOLD
  ) {
    pushUnique(strengths, 'Clear spoken delivery', ENTERPRISE_LIST_MAX);
  }
  if (voiceSection?.metrics?.fillerWords > 8) {
    pushUnique(weaknesses, 'Elevated filler-word usage', ENTERPRISE_LIST_MAX);
    pushUnique(improvementAreas, 'Reduce filler words with paced answers', ENTERPRISE_LIST_MAX);
  }
  if (eyeContactSection?.percent != null && eyeContactSection.percent < 45) {
    pushUnique(weaknesses, 'Limited eye contact with camera', ENTERPRISE_LIST_MAX);
    pushUnique(improvementAreas, 'Practice camera-facing eye contact', ENTERPRISE_LIST_MAX);
  }
  if (bodyLanguageSection?.metrics?.distractionScore >= 40) {
    pushUnique(weaknesses, 'Noticeable distraction signals on camera', ENTERPRISE_LIST_MAX);
  }

  // Phase 6 — per-dimension keyword filter; when overall is gated, drop AI strengths entirely.
  if (!blockAiStrengths) {
    const { keep, moved } = filterNarrativeStrengths(narrative.strengths || [], dimensions);
    for (const s of keep) pushUnique(strengths, s, ENTERPRISE_LIST_MAX);
    for (const w of moved) pushUnique(weaknesses, w, ENTERPRISE_LIST_MAX);
  } else {
    // Still move contradictory AI strengths into weaknesses for coaching clarity.
    const { moved } = filterNarrativeStrengths(narrative.strengths || [], dimensions);
    for (const w of moved) pushUnique(weaknesses, w, ENTERPRISE_LIST_MAX);
  }

  for (const w of narrative.weaknesses || []) pushUnique(weaknesses, w, ENTERPRISE_LIST_MAX);
  for (const i of narrative.improvementAreas || []) pushUnique(improvementAreas, i, ENTERPRISE_LIST_MAX);

  return { strengths, weaknesses, improvementAreas };
};
