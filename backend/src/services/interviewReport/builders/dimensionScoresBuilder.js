/**
 * Phase 2 — dimension scores driven by relevance-gated question scores first.
 * AI narrative may only fine-tune within ±AI_FINE_TUNE_RANGE of that base.
 */

import { DIMENSION_WEIGHTS } from '../../../config/interviewReportConfig.js';
import { avgDefined, clamp100, dimSection, pickScore } from './scoreHelpers.js';

/** Content-driven dimensions — primarily from Phase 1 question scores. */
export const CONTENT_DIMENSIONS = Object.freeze([
  'communication',
  'technicalSkills',
  'behavior',
  'leadership',
  'problemSolving',
  'criticalThinking',
]);

/** @deprecated Use CONTENT_DIMENSIONS */
export const CONTENT_BOUND_DIMENSIONS = CONTENT_DIMENSIONS;

/** Delivery-influenced — voice/presence may contribute, still capped if content ~0. */
export const DELIVERY_INFLUENCED_DIMENSIONS = Object.freeze(['confidence']);

/** Groq may adjust content base by at most this many points. */
export const AI_FINE_TUNE_RANGE = 10;

/** Content average at/below this → confidence hard-capped (can't be confident about nothing). */
const NEAR_ZERO_CONTENT_THRESHOLD = 5;
const NEAR_ZERO_CONFIDENCE_CAP = 15;

/** Shown on Confidence when delivery was reduced by the content cap. */
export const CONFIDENCE_CAP_NOTE =
  'Confidence score reflects your answer content, not just tone — strong delivery alone can\'t offset weak content.';

const LOW_CONTENT_FEEDBACK =
  'No relevant answers were provided to demonstrate this skill.';

/** One-line why templates when Groq feedback is missing (score-band based). */
const REASON_BY_BAND = Object.freeze({
  high: 'Strong signals in this area across your answers.',
  mid: 'Solid basics showed up, but depth and consistency were uneven.',
  low: 'Limited evidence in your answers for this skill.',
  empty: 'Not enough relevant answer content to score this skill.',
  unknown: 'Score reflects your answer quality for this skill.',
});

/**
 * Prefer narrative feedback (trimmed to one short line); else a deterministic band reason.
 * @param {string} key
 * @param {number|null} score
 * @param {string} [feedback]
 */
export const buildDimensionReason = (key, score, feedback = '') => {
  const fromNarrative = String(feedback || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (fromNarrative) {
    // Keep secondary UI compact — one short sentence.
    return fromNarrative.length > 140 ? `${fromNarrative.slice(0, 137).trim()}…` : fromNarrative;
  }

  if (score == null || !Number.isFinite(Number(score))) {
    return REASON_BY_BAND.unknown;
  }
  const n = Number(score);
  if (n <= 5) return REASON_BY_BAND.empty;
  if (n >= 75) return REASON_BY_BAND.high;
  if (n >= 45) return REASON_BY_BAND.mid;
  return REASON_BY_BAND.low;
};

const attachDimensionReasons = (dimensions = {}) => {
  for (const [key, dim] of Object.entries(dimensions)) {
    if (!dim || typeof dim !== 'object') continue;
    dim.reason = buildDimensionReason(key, dim.score, dim.feedback);
  }
  return dimensions;
};


const DIM_META = {
  communication: { label: 'Communication', feedbackKey: 'communicationFeedback' },
  technicalSkills: { label: 'Technical Skills', feedbackKey: 'technicalSkillsFeedback' },
  behavior: { label: 'Behavior', feedbackKey: 'behaviorFeedback' },
  leadership: { label: 'Leadership', feedbackKey: 'leadershipFeedback' },
  problemSolving: { label: 'Problem Solving', feedbackKey: 'problemSolvingFeedback' },
  criticalThinking: { label: 'Critical Thinking', feedbackKey: 'criticalThinkingFeedback' },
  confidence: { label: 'Confidence', feedbackKey: 'confidenceFeedback' },
};

const blend = (measured, narrative, measuredWeight = 0.65) => {
  const m = clamp100(measured, null);
  const n = clamp100(narrative, null);
  if (m == null && n == null) return null;
  if (m == null) return n;
  if (n == null) return m;
  return clamp100(m * measuredWeight + n * (1 - measuredWeight));
};

/** Mean of gated per-question scores (post Phase 1 relevance gate). */
export const averageQuestionReviewScore = (questionReviews = []) => {
  const scores = (Array.isArray(questionReviews) ? questionReviews : [])
    .map((r) => r?.score)
    .filter((n) => n != null && Number.isFinite(Number(n)));
  if (!scores.length) return null;
  return clamp100(avgDefined(scores), null);
};

/**
 * Content base from question reviews. If questions were expected but no scores → 0.
 * Null only when the interview had no questions at all.
 */
export const resolveContentBaseFromQuestions = (
  questionReviews = [],
  expectedQuestionCount = 0
) => {
  const avg = averageQuestionReviewScore(questionReviews);
  if (avg != null) return avg;
  if (Number(expectedQuestionCount) > 0) return 0;
  return null;
};

/**
 * Clamp AI narrative score into [contentBase - range, contentBase + range].
 * Content base is authoritative; AI never overrides wholesale.
 * When content is near-zero, AI may not inflate above base+2.
 */
export const applyAiFineTune = (contentBase, narrativeScore, range = AI_FINE_TUNE_RANGE) => {
  const base = clamp100(contentBase, null);
  if (base == null) return clamp100(narrativeScore, null);

  const ai = clamp100(narrativeScore, null);
  if (ai == null) return base;

  if (base <= NEAR_ZERO_CONTENT_THRESHOLD) {
    return clamp100(Math.min(ai, base + 2));
  }

  const lo = Math.max(0, base - range);
  const hi = Math.min(100, base + range);
  return clamp100(Math.min(hi, Math.max(lo, ai)));
};

/**
 * @param {object} snapshot
 * @param {object} narrativeDims
 * @param {{ questionReviews?: Array<{ score?: number|null }> }} [options]
 */
export const buildDimensionScores = (snapshot = {}, narrativeDims = {}, options = {}) => {
  const speech = snapshot.callSpeechMetrics || {};
  const behavioral = snapshot.behavioralMetrics || {};
  const summary = snapshot.summary || {};
  const questionReviews = options.questionReviews || [];
  const expectedQuestionCount = (snapshot.qa || snapshot.questions || []).length;
  const contentBase = resolveContentBaseFromQuestions(questionReviews, expectedQuestionCount);
  const contentIsNearZero =
    contentBase != null && Number(contentBase) <= NEAR_ZERO_CONTENT_THRESHOLD;

  const confidenceMeasured = pickScore(
    speech.speakingConfidence,
    summary.averageConfidenceScore,
    speech.volumeStability
  );

  // --- CONTENT_DIMENSIONS: question-score first, AI ±10 only ---
  const dimensions = {};
  for (const key of CONTENT_DIMENSIONS) {
    const meta = DIM_META[key];
    const narrativeScore = narrativeDims[key];
    let score;
    let feedback = String(narrativeDims[meta.feedbackKey] || '').trim();

    if (contentBase != null) {
      score = applyAiFineTune(contentBase, narrativeScore, AI_FINE_TUNE_RANGE);
      if (contentIsNearZero) {
        feedback = LOW_CONTENT_FEEDBACK;
      }
    } else {
      // No questions in session — fall back to narrative only (edge case).
      score = clamp100(narrativeScore, null);
    }

    dimensions[key] = dimSection(meta.label, score, feedback, [
      contentBase != null ? `Content base (question avg): ${contentBase}` : null,
    ].filter(Boolean));
  }

  // --- DELIVERY_INFLUENCED: confidence from voice, capped if content ~0 ---
  const deliveryAlone = clamp100(confidenceMeasured, null);
  let confidenceScore = blend(confidenceMeasured, narrativeDims.confidence);
  let confidenceCapApplied = false;

  if (contentIsNearZero) {
    const capped = clamp100(
      Math.min(
        confidenceScore ?? NEAR_ZERO_CONFIDENCE_CAP,
        NEAR_ZERO_CONFIDENCE_CAP
      ),
      NEAR_ZERO_CONFIDENCE_CAP
    );
    // Only annotate when the cap actually lowered what delivery would have produced.
    if (
      (deliveryAlone != null && capped < deliveryAlone) ||
      (confidenceScore != null && capped < confidenceScore)
    ) {
      confidenceCapApplied = true;
    }
    confidenceScore = capped;
  }

  dimensions.confidence = dimSection(
    'Confidence',
    confidenceScore,
    narrativeDims.confidenceFeedback || '',
    confidenceMeasured != null ? [`Measured delivery: ${confidenceMeasured}`] : []
  );

  if (confidenceCapApplied) {
    dimensions.confidence.scoreNote = CONFIDENCE_CAP_NOTE;
  }

  return attachDimensionReasons(dimensions);
};

export const weightedDimensionAverage = (dimensions = {}) => {
  const parts = Object.entries(DIMENSION_WEIGHTS).map(([key, weight]) => ({
    weight,
    value: dimensions[key]?.score,
  }));
  const usable = parts.filter((p) => p.value != null);
  if (!usable.length) return null;
  const wSum = usable.reduce((s, p) => s + p.weight, 0);
  const score = usable.reduce((s, p) => s + p.value * (p.weight / wSum), 0);
  return clamp100(score);
};

export const averageDefinedDimensions = (dimensions = {}) =>
  clamp100(
    avgDefined(Object.values(dimensions).map((d) => d?.score)),
    null
  );

/** Mean of content-driven dimensions only (excludes confidence). */
export const weightedContentDimensionAverage = (dimensions = {}) => {
  const parts = CONTENT_DIMENSIONS.map((key) => ({
    weight: DIMENSION_WEIGHTS[key] ?? 0,
    value: dimensions[key]?.score,
  })).filter((p) => p.value != null && p.weight > 0);
  if (!parts.length) return null;
  const wSum = parts.reduce((s, p) => s + p.weight, 0);
  return clamp100(parts.reduce((s, p) => s + p.value * (p.weight / wSum), 0));
};
