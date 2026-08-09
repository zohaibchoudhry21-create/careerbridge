/**
 * Lightweight adaptive depthHint adjustment (no full guide regeneration).
 * Pure helpers — safe to unit-test; gated by ADAPTIVE_DEPTH_ENABLED at call sites.
 */

import {
  ADAPTIVE_DEPTH_ENABLED,
  ADAPTIVE_DEPTH_STRONG_MIN_CHARS,
  GUIDE_DEPTH_HINTS,
} from '../../config/interviewIntelligenceConfig.js';
import { evaluateAnswerRelevance } from '../interviewReport/builders/evaluateAnswerRelevance.js';

const DEPTH_ORDER = GUIDE_DEPTH_HINTS;

const WEAK_CLASSIFICATIONS = new Set(['empty', 'gibberish', 'question_echo', 'off_topic']);

export const normalizeDepthHint = (value) => {
  const v = String(value || 'standard').toLowerCase().trim();
  return DEPTH_ORDER.includes(v) ? v : 'standard';
};

export const bumpDepthHint = (depth) => {
  const current = normalizeDepthHint(depth);
  const idx = DEPTH_ORDER.indexOf(current);
  if (idx < 0 || idx >= DEPTH_ORDER.length - 1) return current;
  return DEPTH_ORDER[idx + 1];
};

export const stepDownDepthHint = (depth) => {
  const current = normalizeDepthHint(depth);
  const idx = DEPTH_ORDER.indexOf(current);
  if (idx <= 0) return current;
  return DEPTH_ORDER[idx - 1];
};

/**
 * @param {string} classification
 * @param {string} answerText
 * @param {number} [strongMinChars]
 * @returns {'strong'|'weak'|'neutral'}
 */
export const classifyAnswerStrength = (
  classification,
  answerText,
  strongMinChars = ADAPTIVE_DEPTH_STRONG_MIN_CHARS
) => {
  if (WEAK_CLASSIFICATIONS.has(classification)) return 'weak';
  if (classification === 'on_topic') {
    const len = String(answerText || '').trim().length;
    if (len >= strongMinChars) return 'strong';
  }
  return 'neutral';
};

/**
 * Decide whether the next guide item's depthHint should change.
 * Conservative: only bump standard→deep on 2 strong; only step down on 2 weak;
 * never change on final question; never change when uncertain (neutral).
 *
 * @returns {{ from: string, to: string, direction: 'up'|'down' } | null}
 */
export const suggestNextDepthAdjustment = ({
  lastStrengths = [],
  nextDepthHint = 'standard',
  isFinalQuestion = false,
  enabled = ADAPTIVE_DEPTH_ENABLED,
} = {}) => {
  if (!enabled || isFinalQuestion) return null;

  const recent = (Array.isArray(lastStrengths) ? lastStrengths : []).slice(-2);
  if (recent.length < 2) return null;

  const from = normalizeDepthHint(nextDepthHint);
  const [a, b] = recent;

  if (a === 'strong' && b === 'strong') {
    // Spec: bump one level if it was going to be "standard".
    if (from !== 'standard') return null;
    const to = bumpDepthHint(from);
    if (to === from) return null;
    return { from, to, direction: 'up' };
  }

  if (a === 'weak' && b === 'weak') {
    const to = stepDownDepthHint(from);
    if (to === from) return null;
    return { from, to, direction: 'down' };
  }

  return null;
};

/**
 * Apply adjustment onto session.questions[nextIndex] when safe.
 * Mutates a shallow-copied questions array; returns { questions, adjustment }.
 */
export const applyAdaptiveDepthToQuestions = (
  questions = [],
  {
    answeredCount = 0,
    lastStrengths = [],
    enabled = ADAPTIVE_DEPTH_ENABLED,
  } = {}
) => {
  const list = Array.isArray(questions) ? questions.map((q) => ({ ...q })) : [];
  const nextIndex = Math.max(0, Number(answeredCount) || 0);
  const isFinalQuestion = nextIndex >= list.length - 1 || list.length === 0;

  if (!list.length || isFinalQuestion) {
    return { questions: list, adjustment: null };
  }

  const next = list[nextIndex];
  const adjustment = suggestNextDepthAdjustment({
    lastStrengths,
    nextDepthHint: next?.depthHint || 'standard',
    isFinalQuestion: false,
    enabled,
  });

  if (!adjustment) {
    return { questions: list, adjustment: null };
  }

  list[nextIndex] = {
    ...next,
    depthHint: adjustment.to,
  };

  return { questions: list, adjustment };
};

/**
 * Classify one answer and return strength for the adaptive ladder.
 */
export const evaluateAnswerForAdaptiveDepth = (answerText, questionText = '') => {
  const classification = evaluateAnswerRelevance(answerText, questionText);
  const strength = classifyAnswerStrength(classification, answerText);
  return { classification, strength };
};

export const buildAdaptiveDepthSystemNudge = (adjustment) => {
  if (!adjustment?.to || !adjustment?.from) return null;
  if (adjustment.direction === 'up') {
    return `Adaptive depth (internal): the candidate's last two answers were strong and on-topic. For the NEXT guide question only, treat depthHint as "${adjustment.to}" (was "${adjustment.from}"). Ask a deeper follow-through on that item. Do not announce this adjustment.`;
  }
  return `Adaptive depth (internal): the candidate's last two answers were weak or off-topic. For the NEXT guide question only, treat depthHint as "${adjustment.to}" (was "${adjustment.from}"). Simplify / scaffold that item. Do not announce this adjustment.`;
};

export default {
  bumpDepthHint,
  stepDownDepthHint,
  classifyAnswerStrength,
  suggestNextDepthAdjustment,
  applyAdaptiveDepthToQuestions,
  evaluateAnswerForAdaptiveDepth,
  buildAdaptiveDepthSystemNudge,
};
