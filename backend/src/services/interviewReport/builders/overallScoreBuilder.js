import {
  CONTENT_CEILING_PADDING,
  CONTENT_CEILING_THRESHOLD,
  MAX_DELIVERY_INFLUENCE_ON_OVERALL,
} from '../../../config/interviewReportConfig.js';
import {
  applyScoreCeiling,
  computeContentScoreCeiling,
} from './contentCeiling.js';
import { avgDefined, clamp100 } from './scoreHelpers.js';
import {
  weightedContentDimensionAverage,
  weightedDimensionAverage,
} from './dimensionScoresBuilder.js';

export { CONTENT_CEILING_PADDING, CONTENT_CEILING_THRESHOLD, MAX_DELIVERY_INFLUENCE_ON_OVERALL };
export { computeContentScoreCeiling } from './contentCeiling.js';

/** Below this content core, delivery cannot lift overall at all. */
export const NEAR_ZERO_CONTENT_CORE = 5;

/**
 * Content average used for diagnostics / strengths gating.
 * Prefer gated questionReviews; if questions were expected but no usable scores,
 * treat as 0. Only skip when the interview had no questions at all.
 */
export const resolveContentAverage = (
  questionReviews = [],
  dimensions = {},
  { expectedQuestionCount = 0 } = {}
) => {
  const reviewScores = (Array.isArray(questionReviews) ? questionReviews : [])
    .map((r) => r?.score)
    .filter((n) => n != null && Number.isFinite(Number(n)));

  if (reviewScores.length) {
    return clamp100(avgDefined(reviewScores), null);
  }

  if (Number(expectedQuestionCount) > 0) {
    return 0;
  }

  return clamp100(
    avgDefined([
      dimensions.technicalSkills?.score,
      dimensions.problemSolving?.score,
      dimensions.communication?.score,
    ]),
    null
  );
};

/** @deprecated Phase 5 overall no longer uses this; kept for tests/compat. */
export const applyContentCeiling = (overall, contentAvg) => {
  const ceiling = computeContentScoreCeiling(contentAvg);
  return applyScoreCeiling(overall, ceiling, 0);
};

/**
 * Cap how far an uncapped overall may sit above contentCore.
 * Kept for unit tests; Phase 5 overall uses computeCappedDeliveryBonus instead.
 */
export const applyMaxDeliveryInfluence = (
  contentCore,
  uncappedOverall,
  maxInfluence = MAX_DELIVERY_INFLUENCE_ON_OVERALL
) => {
  const core = clamp100(contentCore, 0);
  const uncapped = clamp100(uncappedOverall, core);
  const inflation = Math.max(0, Number(uncapped) - Number(core));
  const cappedInflation = Math.min(inflation, maxInfluence);
  return clamp100(Number(core) + cappedInflation, 0);
};

/**
 * Phase 5 — delivery bonus from voice/presence only, hard-capped.
 * Near-zero content (contentCore ≤ 5) gets zero bonus so empty/gibberish
 * interviews stay in the 0–5 overall band.
 *
 * Formula:
 *   rawBonus = (deliveryAvg / 100) * MAX_DELIVERY_INFLUENCE_ON_OVERALL
 *   cappedDeliveryBonus = contentCore <= 5 ? 0 : min(MAX, rawBonus)
 */
export const computeCappedDeliveryBonus = (
  contentCore,
  voice = null,
  presence = null,
  maxInfluence = MAX_DELIVERY_INFLUENCE_ON_OVERALL
) => {
  const core = clamp100(contentCore, 0);
  if (core <= NEAR_ZERO_CONTENT_CORE) return 0;

  const deliveryAvg = avgDefined([voice, presence]);
  if (deliveryAvg == null) return 0;

  const rawBonus = (Number(deliveryAvg) / 100) * maxInfluence;
  return Math.min(maxInfluence, Math.max(0, rawBonus));
};

/**
 * Phase 5 — direct overall (no blend-then-ceiling):
 *   overallScore = weightedAverage(CONTENT_DIMENSIONS) + cappedDeliveryBonus
 */
export const buildOverallScoreWithMeta = ({
  dimensions,
  voiceSection,
  eyeContactSection,
  bodyLanguageSection,
  legacyOverall,
  questionReviews,
  expectedQuestionCount = 0,
} = {}) => {
  const contentCore =
    weightedContentDimensionAverage(dimensions) ??
    weightedDimensionAverage(dimensions) ??
    (Number(expectedQuestionCount) > 0 ? 0 : clamp100(legacyOverall, 0));

  const voice = voiceSection?.score ?? null;
  const presenceValues = [eyeContactSection?.score, bodyLanguageSection?.score].filter(
    (n) => n != null
  );
  const presence = presenceValues.length
    ? clamp100(presenceValues.reduce((a, b) => a + b, 0) / presenceValues.length)
    : null;

  const cappedDeliveryBonus = computeCappedDeliveryBonus(
    contentCore ?? 0,
    voice,
    presence,
    MAX_DELIVERY_INFLUENCE_ON_OVERALL
  );

  const overall = clamp100(Number(contentCore ?? 0) + cappedDeliveryBonus, 0);

  const contentAvg = resolveContentAverage(questionReviews, dimensions, {
    expectedQuestionCount,
  });
  // Diagnostic only — Phase 5 does not apply this ceiling to overall.
  const ceiling = computeContentScoreCeiling(contentAvg);

  return {
    overall,
    preCeiling: overall,
    uncappedOverall: clamp100(
      Number(contentCore ?? 0) +
        ((avgDefined([voice, presence]) ?? 0) / 100) * MAX_DELIVERY_INFLUENCE_ON_OVERALL,
      0
    ),
    contentCore: contentCore ?? 0,
    cappedDeliveryBonus,
    deliveryInfluenceApplied: cappedDeliveryBonus,
    maxDeliveryInfluence: MAX_DELIVERY_INFLUENCE_ON_OVERALL,
    ceiling,
    contentAvg,
    dimAvg: weightedDimensionAverage(dimensions),
    voice,
    presence,
  };
};

export const buildOverallScore = (args = {}) => buildOverallScoreWithMeta(args).overall;
