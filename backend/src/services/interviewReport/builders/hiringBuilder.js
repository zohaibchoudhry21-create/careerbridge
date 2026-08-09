import { HIRING_BANDS } from '../../../config/interviewReportConfig.js';
import { clamp100 } from './scoreHelpers.js';

export const resolveHiringBand = (overallScore) => {
  const score = clamp100(overallScore, 0);
  const band = HIRING_BANDS.find((b) => score >= b.min) || HIRING_BANDS[HIRING_BANDS.length - 1];
  return { ...band, score };
};

/**
 * Phase 5 — hire probability scales with overall score (not a flat band base).
 *
 * Soft-cap at 95. Within each decision band, probability tracks overall directly
 * so a 2/100 interview cannot show ~28% like the old probabilityBase path.
 *
 *   probability ≈ clamp(round(overallScore), 0, 95)
 */
export const scaleHiringProbability = (overallScore) => {
  const score = clamp100(overallScore, 0);
  return clamp100(Math.min(95, Math.round(score)), 0);
};

/**
 * Rule-based hiring probability + recommendation.
 * Decision ALWAYS comes from resolveHiringBand(overallScore) — never AI override.
 * Narrative may supply rationale text only.
 */
export const buildHiringSections = (overallScore, dimensions = {}, narrative = {}) => {
  const { decision, band, score } = resolveHiringBand(overallScore);

  const factors = Object.entries(dimensions)
    .filter(([, d]) => d?.score != null)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 4)
    .map(([key, d]) => `${d.label || key}: ${d.score}`);

  const percent = scaleHiringProbability(score);

  return {
    hiringRecommendation: {
      decision, // rule-based only — ignore narrative.decision
      rationale: String(narrative.rationale || '').trim(),
      confidence: clamp100(narrative.confidence ?? percent, percent),
    },
    hiringProbability: {
      percent,
      band,
      factors,
      overallScore: score,
    },
  };
};
