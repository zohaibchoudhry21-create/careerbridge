/**
 * Diff Validation — rewrite must be substantially different (not superficial edits).
 */

import { clampScore } from '../../resumeScannerTextUtils.js';
import { changedTokenRatio, jaccardSimilarity } from './textMetrics.js';

/** Reject near-identical rewrites. */
export const validateDiff = (originalText, rewrittenText) => {
  const similarity = jaccardSimilarity(originalText, rewrittenText);
  const novelty = changedTokenRatio(originalText, rewrittenText);

  const tooSimilar = similarity > 0.88 && novelty < 0.12;
  const issues = [];
  if (tooSimilar) issues.push('rewrite_too_similar');

  return {
    id: 'diff',
    valid: issues.length === 0,
    issues,
    similarity: clampScore(similarity * 100),
    novelty: clampScore(novelty * 100),
  };
};
