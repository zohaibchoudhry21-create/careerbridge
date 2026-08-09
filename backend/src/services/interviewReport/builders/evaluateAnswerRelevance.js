/**
 * Phase 1 — pure deterministic answer relevance classifier.
 * No DB, no network, no side effects. Safe to unit-test in isolation.
 *
 * Classifications: empty | gibberish | question_echo | off_topic | on_topic
 */

const MIN_ANSWER_CHARS = 10;
const MIN_KEYWORD_OVERLAP = 0.08;
const QUESTION_ECHO_ANSWER_FRAC = 0.7;
const QUESTION_ECHO_MAX_ORIGINAL = 2;

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'if',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'am',
  'i',
  'me',
  'my',
  'we',
  'you',
  'your',
  'he',
  'she',
  'it',
  'they',
  'them',
  'this',
  'that',
  'these',
  'those',
  'with',
  'from',
  'by',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'up',
  'down',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'here',
  'there',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'can',
  'will',
  'just',
  'don',
  'should',
  'now',
  'tell',
  'me',
  'what',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'please',
  'describe',
  'explain',
  'discuss',
]);

/** Fixed score + feedback when AI scoring is skipped (non-on_topic). */
export const RELEVANCE_FIXED_OUTCOMES = Object.freeze({
  empty: {
    score: 0,
    feedback: 'No answer provided.',
  },
  gibberish: {
    score: 1,
    feedback: 'Answer does not appear to address the question.',
  },
  question_echo: {
    score: 1,
    feedback: 'Answer restates the question without providing a substantive response.',
  },
  off_topic: {
    score: 1,
    feedback: 'Answer does not appear to address the question.',
  },
});

export const RELEVANCE_CLASSIFICATIONS = Object.freeze([
  'empty',
  'gibberish',
  'question_echo',
  'off_topic',
  'on_topic',
]);

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ''))
    .filter((t) => t.length >= 2);

const contentTokens = (text) => tokenize(text).filter((t) => !STOP_WORDS.has(t));

const normalizeText = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * @param {string} answer - Candidate answer text
 * @param {string} question - Interview question text
 * @returns {'empty'|'gibberish'|'question_echo'|'off_topic'|'on_topic'}
 */
export const evaluateAnswerRelevance = (answer, question) => {
  const answerText = String(answer || '').trim();
  const questionText = String(question || '').trim();

  if (answerText.length < MIN_ANSWER_CHARS) {
    return 'empty';
  }

  const tokens = tokenize(answerText);
  const alphaTokens = tokens.filter((t) => /[a-z]/.test(t));

  if (alphaTokens.length === 0) {
    return 'gibberish';
  }

  const unique = new Set(alphaTokens);
  if (unique.size === 1 && alphaTokens.length >= 2) {
    return 'gibberish';
  }

  const letterCount = (answerText.match(/[a-zA-Z]/g) || []).length;
  if (letterCount / answerText.length < 0.35 && alphaTokens.length < 3) {
    return 'gibberish';
  }

  const vowelCount = (answerText.match(/[aeiouyAEIOUY]/g) || []).length;
  if (letterCount >= 8 && vowelCount / letterCount < 0.22) {
    return 'gibberish';
  }

  if (answerText.length >= 20 && unique.size <= 2 && alphaTokens.length >= 3) {
    return 'gibberish';
  }

  const qTokenList = contentTokens(questionText);
  const aTokenList = contentTokens(answerText);
  const qTokenSet = new Set(qTokenList);

  if (aTokenList.length >= 2 && qTokenList.length >= 2) {
    const answerFromQuestion = aTokenList.filter((t) => qTokenSet.has(t)).length;
    const answerFrac = answerFromQuestion / aTokenList.length;
    const originalTokens = aTokenList.filter((t) => !qTokenSet.has(t)).length;
    if (answerFrac >= QUESTION_ECHO_ANSWER_FRAC && originalTokens <= QUESTION_ECHO_MAX_ORIGINAL) {
      return 'question_echo';
    }

    const nq = normalizeText(questionText);
    const na = normalizeText(answerText);
    if (nq && na && (na === nq || (nq.length >= 20 && na.includes(nq)))) {
      return 'question_echo';
    }
  }

  const aTokens = new Set(aTokenList);
  if (qTokenList.length >= 2 && aTokens.size > 0) {
    const overlap = qTokenList.filter((t) => aTokens.has(t)).length;
    const ratio = overlap / qTokenList.length;
    if (ratio < MIN_KEYWORD_OVERLAP && overlap === 0) {
      return 'off_topic';
    }
  }

  return 'on_topic';
};

/**
 * Resolve score/feedback for a classification.
 * Non-on_topic → fixed outcome (AI skipped). on_topic → use AI narrative fields.
 */
export const resolveRelevanceOutcome = (
  classification,
  { narrativeScore = null, narrativeFeedback = '' } = {}
) => {
  if (classification !== 'on_topic') {
    const fixed = RELEVANCE_FIXED_OUTCOMES[classification] || RELEVANCE_FIXED_OUTCOMES.off_topic;
    return {
      classification,
      needsAiScore: false,
      score: fixed.score,
      feedback: fixed.feedback,
    };
  }

  const n = Number(narrativeScore);
  return {
    classification: 'on_topic',
    needsAiScore: true,
    score: Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : null,
    feedback: String(narrativeFeedback || '').trim(),
  };
};
