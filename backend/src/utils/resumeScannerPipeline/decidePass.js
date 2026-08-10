/**
 * Pass 5 — Decision Engine
 * Chooses optimize vs full rewrite from similarity + mismatch signals.
 */

import {
  getRewriteTriggerReason,
  shouldTriggerRewriteMode,
} from '../resumeScannerMismatch.js';

/**
 * @returns {{ mode: 'optimize'|'rewrite', reason: string|null, confidence: number, signals: object }}
 */
export const runDecidePass = ({
  similarity = {},
  skills = [],
} = {}) => {
  const keywordCoverage = Number(similarity.keywordCoverage) || 0;
  const jobRelevanceScore = Number(similarity.jobRelevanceScore) || 0;
  const jobMatchScore =
    similarity.jobMatchScore == null ? null : Number(similarity.jobMatchScore) || 0;

  const thresholdHit = shouldTriggerRewriteMode({
    keywordCoverage,
    jobRelevanceScore,
    jobMatchScore,
    skills,
  });

  const reason =
    getRewriteTriggerReason({
      keywordCoverage,
      jobRelevanceScore,
      jobMatchScore,
      skills,
    }) ||
    (!similarity.domainAligned ? 'domain_mismatch' : null) ||
    (similarity.rewriteRecommended ? 'low_overall_similarity' : null);

  const mode = thresholdHit || similarity.rewriteRecommended ? 'rewrite' : 'optimize';

  // Confidence increases when multiple signals agree
  let agreement = 0;
  if (thresholdHit) agreement += 1;
  if (similarity.rewriteRecommended) agreement += 1;
  if (!similarity.domainAligned) agreement += 1;
  if (keywordCoverage < 15) agreement += 1;
  if (jobRelevanceScore < 40) agreement += 1;

  const confidence =
    mode === 'rewrite'
      ? Math.min(0.95, 0.55 + agreement * 0.1)
      : Math.min(0.95, 0.5 + (similarity.overallSimilarity || 0) / 200);

  return {
    mode,
    reason: mode === 'rewrite' ? reason || 'low_match' : null,
    confidence,
    signals: {
      thresholdHit,
      rewriteRecommended: Boolean(similarity.rewriteRecommended),
      domainAligned: Boolean(similarity.domainAligned),
      overallSimilarity: similarity.overallSimilarity,
      keywordCoverage,
      jobRelevanceScore,
      jobMatchScore,
      // Composite quality score kept for diagnostics only.
      aiAssessedRelevance: Number(similarity.aiRelevance) || 0,
    },
  };
};
