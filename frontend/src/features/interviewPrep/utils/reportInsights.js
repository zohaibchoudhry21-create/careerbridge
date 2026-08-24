import { INTERVIEW_FOCUS_AREAS } from '../constants/interviewPrepConstants';

/**
 * Presentation helpers for the interview report: score bands, attempt-over-attempt
 * deltas, delivery-metric benchmarks, and weak-area → focus-area mapping.
 * Scores themselves stay backend-owned; nothing here changes them.
 */

const SCORE_BANDS = [
  { key: 'strong', min: 80 },
  { key: 'good', min: 60 },
  { key: 'developing', min: 40 },
  { key: 'needsWork', min: 0 },
];

const BAND_CLASSES = {
  strong: { text: 'text-emerald-600', ring: 'text-emerald-500' },
  good: { text: 'text-secondary', ring: 'text-secondary' },
  developing: { text: 'text-amber-600', ring: 'text-amber-500' },
  needsWork: { text: 'text-rose-600', ring: 'text-rose-500' },
};

export const TONE_TEXT_CLASSES = {
  good: 'text-emerald-600',
  ok: 'text-amber-600',
  low: 'text-rose-600',
};

export const toFiniteNumber = (value) => {
  if (value === '' || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * @param {number|string|null} score
 * @returns {{ key: string, text: string, ring: string } | null}
 */
export function getScoreBand(score) {
  const value = toFiniteNumber(score);
  if (value == null) return null;
  const band = SCORE_BANDS.find((item) => value >= item.min) || SCORE_BANDS[SCORE_BANDS.length - 1];
  return { key: band.key, ...BAND_CLASSES[band.key] };
}

/** Rounded difference, or null when either side is missing or nothing changed. */
export function getDelta(current, previous) {
  const now = toFiniteNumber(current);
  const before = toFiniteNumber(previous);
  if (now == null || before == null) return null;
  const diff = Math.round(now - before);
  return diff === 0 ? null : diff;
}

/**
 * Report history arrives oldest-first. The attempt before this session is the
 * comparison baseline; when this session is not in history yet (report just
 * generated) the latest stored attempt is the baseline instead.
 */
export function findPreviousHistoryEntry(history, currentSessionId) {
  if (!Array.isArray(history) || !history.length) return null;

  const index = currentSessionId
    ? history.findIndex((item) => String(item?.sessionId) === String(currentSessionId))
    : -1;

  if (index === 0) return null;
  if (index > 0) return history[index - 1];
  return history[history.length - 1];
}

/** Widely used interview pacing window. */
export function getPaceTone(wpm) {
  const value = toFiniteNumber(wpm);
  if (value == null) return null;
  if (value >= 120 && value <= 160) return 'good';
  if (value >= 100 && value <= 180) return 'ok';
  return 'low';
}

export function getPercentTone(percent) {
  const value = toFiniteNumber(percent);
  if (value == null) return null;
  if (value >= 60) return 'good';
  if (value >= 40) return 'ok';
  return 'low';
}

/**
 * Only rate fillers when a normalized rate is available — a raw count means
 * nothing without knowing how long the candidate spoke.
 */
export function getFillerTone(fillersPer100Words) {
  const value = toFiniteNumber(fillersPer100Words);
  if (value == null) return null;
  if (value < 3) return 'good';
  if (value <= 6) return 'ok';
  return 'low';
}

/** Weakest scored dimensions first. */
export function pickWeakestDimensions(dimensions = {}, limit = 3) {
  if (!dimensions || typeof dimensions !== 'object') return [];

  return Object.entries(dimensions)
    .map(([key, dimension]) => ({
      key,
      label: dimension?.label || '',
      score: toFiniteNumber(dimension?.score),
    }))
    .filter((item) => item.score != null)
    .sort((a, b) => a.score - b.score)
    .slice(0, Math.max(0, limit));
}

/** Dimension → setup focus area, so a weak report can seed the next session. */
const DIMENSION_FOCUS_AREA = {
  communication: 'Communication',
  confidence: 'Communication',
  technicalSkills: 'Coding',
  behavior: 'Behavioral',
  leadership: 'Leadership',
  problemSolving: 'System design',
  criticalThinking: 'Case study',
};

export function focusAreasFromWeakDimensions(dimensions, limit = 3) {
  const areas = [];

  for (const { key } of pickWeakestDimensions(dimensions, limit + 3)) {
    const area = DIMENSION_FOCUS_AREA[key];
    if (!area || areas.includes(area) || !INTERVIEW_FOCUS_AREAS.includes(area)) continue;
    areas.push(area);
    if (areas.length >= limit) break;
  }

  return areas;
}
