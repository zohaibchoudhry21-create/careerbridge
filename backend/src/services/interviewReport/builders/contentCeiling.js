/**
 * Shared low-content score ceilings for dimensions + overall.
 * When gated per-question average is weak, delivery/narrative cannot inflate scores.
 */

import { CONTENT_CEILING_THRESHOLD } from '../../../config/interviewReportConfig.js';
import { clamp100 } from './scoreHelpers.js';

/**
 * Proportional ceiling from content/question average.
 * - avg <= 5  → avg + 1  (fully irrelevant with floor~1 → overall in 0–5)
 * - else      → avg + avg * 0.3
 * Returns null when no ceiling should apply (healthy content).
 */
export const computeContentScoreCeiling = (contentAvg) => {
  if (contentAvg == null || !Number.isFinite(Number(contentAvg))) return null;
  const avg = Number(contentAvg);
  if (avg >= CONTENT_CEILING_THRESHOLD) return null;
  if (avg <= 5) return clamp100(avg + 1, 0);
  return clamp100(avg + avg * 0.3, 0);
};

/** Confidence may keep a little delivery room; hard-cap when content is empty. */
export const computeConfidenceCeiling = (questionAvg) => {
  if (questionAvg == null || !Number.isFinite(Number(questionAvg))) return null;
  const avg = Number(questionAvg);
  if (avg >= CONTENT_CEILING_THRESHOLD) return null;
  if (avg <= 0) return 15;
  const contentCeiling = computeContentScoreCeiling(avg);
  if (contentCeiling == null) return null;
  return clamp100(Math.max(15, contentCeiling + 5), 15);
};

export const applyScoreCeiling = (score, ceiling, fallback = null) => {
  if (score == null) return fallback;
  if (ceiling == null || !Number.isFinite(Number(ceiling))) return clamp100(score, fallback);
  return clamp100(Math.min(Number(score), Number(ceiling)), fallback);
};
