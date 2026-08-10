/**
 * Pair live interview transcript into question → answer rows.
 * Source of truth for report Q&A is what was actually spoken, not the
 * pre-generated question guide (guide is only used for soft metadata match
 * and as a last-resort fallback when no spoken questions are found).
 */

import { QUESTION_REVIEW_MAX } from '../../../config/interviewReportConfig.js';

const QUESTION_STEM =
  /^(can you|could you|would you|will you|how (do|would|can|did|have|are|is)|what (is|are|do|would|was|were|have|has)|why |when |where |which |tell me|walk me through|describe |explain |share |talk (to me )?about|give me (an )?example|have you|did you|do you|are you|is there|let'?s (talk|start|discuss)|i'?d like (to hear|you to)|i would like you to)/i;

const ACK_OR_BRIDGE =
  /^(got it|okay|ok|alright|all right|thanks|thank you|that makes sense|interesting|i see|mm-?hmm|mhm|great|perfect|wonderful|nice|sure|understood|fair enough|makes sense|right|yeah|yes|absolutely|exactly)[.!,]?\s*$/i;

const GREETING_OR_CLOSING =
  /^(hi|hello|hey|welcome|good (morning|afternoon|evening)|thanks for (joining|coming|your time)|thank you for (joining|coming|your time)|that('s| is) (all|it) for (today|now)|we('re| are) (going to )?wrap|wrapping up|end of (the )?interview|have a (great|good|nice) (day|one))/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
export const looksLikeInterviewQuestion = (text) => {
  const t = String(text || '').trim();
  if (!t || t.length < 8) return false;
  if (/\?/.test(t)) return true;
  return QUESTION_STEM.test(t);
};

/**
 * Acknowledgments, greetings, closings — not scored as interview questions.
 * @param {string} text
 * @returns {boolean}
 */
export const isNonQuestionAssistantChatter = (text) => {
  const t = String(text || '').trim();
  if (!t) return true;
  if (looksLikeInterviewQuestion(t)) return false;
  if (t.length <= 100 && ACK_OR_BRIDGE.test(t)) return true;
  if (GREETING_OR_CLOSING.test(t) && !/\?/.test(t)) return true;
  return false;
};

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

/**
 * Soft-match spoken question to planned guide for focusTag / depthHint only.
 * Never replaces spoken question text.
 */
const matchGuideMeta = (spokenQuestion, guideQuestions = []) => {
  const spokenTokens = new Set(tokenize(spokenQuestion));
  if (!spokenTokens.size || !guideQuestions.length) return null;

  let best = null;
  let bestScore = 0;

  for (const g of guideQuestions) {
    const guideText = String(g.text || g.question || '').trim();
    const guideTokens = tokenize(guideText);
    if (!guideTokens.length) continue;

    let overlap = 0;
    for (const tok of guideTokens) {
      if (spokenTokens.has(tok)) overlap += 1;
    }
    const score = overlap / Math.max(guideTokens.length, spokenTokens.size);
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }

  if (!best || bestScore < 0.22) return null;
  return {
    focusTag: best.focusTag,
    depthHint: best.depthHint,
    matchedGuideQuestionId: best.questionId,
  };
};

/**
 * Extract Q&A pairs from a normalized transcript [{ role, content }].
 *
 * @param {Array<{ role?: string, content?: string }>} transcript
 * @param {{ guideQuestions?: Array<object>, maxPairs?: number }} [options]
 * @returns {Array<{ questionId: string, question: string, answer: string, transcript: string, focusTag?: string, depthHint?: string, source: 'transcript'|'guide_fallback' }>}
 */
export const extractTranscriptQaPairs = (transcript = [], options = {}) => {
  const turns = (Array.isArray(transcript) ? transcript : [])
    .map((t) => ({
      role: String(t.role || '').toLowerCase() === 'user' ? 'user' : 'assistant',
      content: String(t.content || '').trim(),
    }))
    .filter((t) => t.content);

  const guideQuestions = Array.isArray(options.guideQuestions) ? options.guideQuestions : [];
  const maxPairs = Math.max(1, Number(options.maxPairs) || QUESTION_REVIEW_MAX);

  const pairs = [];
  let i = 0;

  while (i < turns.length && pairs.length < maxPairs) {
    const turn = turns[i];
    if (turn.role !== 'assistant' || !looksLikeInterviewQuestion(turn.content)) {
      i += 1;
      continue;
    }

    const questionText = turn.content;
    const answerParts = [];
    let j = i + 1;

    while (j < turns.length) {
      const next = turns[j];
      if (next.role === 'user') {
        answerParts.push(next.content);
        j += 1;
        continue;
      }
      // Assistant: stop at next real question; skip acks/bridges mid-answer.
      if (looksLikeInterviewQuestion(next.content)) {
        break;
      }
      j += 1;
    }

    const answer = answerParts.join(' ').trim();
    const meta = matchGuideMeta(questionText, guideQuestions) || {};

    pairs.push({
      questionId: `live-q${pairs.length + 1}`,
      question: questionText,
      answer,
      transcript: answer,
      focusTag: meta.focusTag,
      depthHint: meta.depthHint,
      source: 'transcript',
      ...(meta.matchedGuideQuestionId
        ? { matchedGuideQuestionId: meta.matchedGuideQuestionId }
        : {}),
    });

    i = j;
  }

  if (pairs.length > 0) {
    return pairs;
  }

  // Last resort: planned guide + index-aligned user turns (legacy behavior).
  if (!guideQuestions.length) {
    return [];
  }

  const userTurns = turns.filter((t) => t.role === 'user').map((t) => t.content);
  return guideQuestions.slice(0, maxPairs).map((q, index) => {
    const answer =
      userTurns[index] || (userTurns.length === 1 && index === 0 ? userTurns[0] : '') || '';
    return {
      questionId: q.questionId || `q${index + 1}`,
      question: String(q.text || q.question || '').trim(),
      answer,
      transcript: answer,
      focusTag: q.focusTag,
      depthHint: q.depthHint,
      source: 'guide_fallback',
    };
  });
};
