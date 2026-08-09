/**
 * Rewrite Quality Validation — length / readability / non-degenerate output.
 * Does not own similarity/diff (see diffValidation).
 */

import { clampScore } from '../../resumeScannerTextUtils.js';
import { tokenize } from './textMetrics.js';

export const validateQuality = (originalText, rewrittenText) => {
  const originalTokens = tokenize(originalText);
  const rewrittenTokens = tokenize(rewrittenText);
  const issues = [];

  const tooShort =
    rewrittenTokens.length < Math.max(20, originalTokens.length * 0.35);
  if (tooShort) issues.push('rewrite_too_short');

  // Degenerate: almost no content after normalization
  if (rewrittenTokens.length < 12) {
    issues.push('rewrite_unreadable');
  }

  // Readability proxy: average token length shouldn't collapse to gibberish
  const avgLen =
    rewrittenTokens.reduce((sum, t) => sum + t.length, 0) /
    (rewrittenTokens.length || 1);
  if (rewrittenTokens.length >= 12 && avgLen < 2.5) {
    issues.push('rewrite_low_readability');
  }

  return {
    id: 'quality',
    valid: issues.length === 0,
    issues,
    tokenCount: rewrittenTokens.length,
    score: clampScore(
      tooShort ? 40 : Math.min(100, 50 + (rewrittenTokens.length / Math.max(originalTokens.length, 1)) * 50)
    ),
  };
};
