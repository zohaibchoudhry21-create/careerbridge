import { QUESTION_REVIEW_MAX } from '../../../config/interviewReportConfig.js';
import {
  evaluateAnswerRelevance,
  resolveRelevanceOutcome,
  RELEVANCE_FIXED_OUTCOMES,
} from './evaluateAnswerRelevance.js';

export {
  evaluateAnswerRelevance,
  resolveRelevanceOutcome,
  RELEVANCE_FIXED_OUTCOMES,
} from './evaluateAnswerRelevance.js';

/** @deprecated Use RELEVANCE_FIXED_OUTCOMES / resolveRelevanceOutcome */
export const IRRELEVANT_ANSWER_SCORE = 1;
/** @deprecated Use per-category feedback in RELEVANCE_FIXED_OUTCOMES */
export const IRRELEVANT_ANSWER_FEEDBACK = 'No relevant answer provided for this question.';

/**
 * @deprecated Prefer evaluateAnswerRelevance(answer, question).
 * Returns classification when not on_topic, else null (legacy callers).
 */
export const detectIrrelevantAnswer = (questionText, answerText) => {
  const classification = evaluateAnswerRelevance(answerText, questionText);
  return classification === 'on_topic' ? null : classification;
};

const GATED_RELEVANCE = new Set(['empty', 'gibberish', 'question_echo', 'off_topic']);

/**
 * Hard post-merge enforcement: for any gated classification, forcibly overwrite
 * score/feedback with the deterministic fixed outcome — even if Groq narrative
 * (or a buggy merge) tried to invent a higher score.
 *
 * @param {Array<object>} reviews
 * @returns {Array<object>}
 */
export const enforceDeterministicRelevanceGate = (reviews = []) =>
  (Array.isArray(reviews) ? reviews : []).map((review) => {
    const classification = review?.relevanceGate || review?.relevance;
    if (!GATED_RELEVANCE.has(classification)) {
      return review;
    }
    const fixed =
      RELEVANCE_FIXED_OUTCOMES[classification] || RELEVANCE_FIXED_OUTCOMES.off_topic;
    return {
      ...review,
      score: fixed.score,
      feedback: fixed.feedback,
      followUpNotes: '',
      needsAiScore: false,
      relevance: classification,
      relevanceGate: classification,
    };
  });

/**
 * Build question-by-question reviews.
 * 1) Pure relevance classification (no AI)
 * 2) Non-on_topic → fixed low score + feedback (AI narrative score ignored / skipped)
 * 3) on_topic → use Groq narrative score/feedback when present
 * 4) Hard enforce step re-applies fixed outcomes (code-level, not prompt-level)
 */
export const buildQuestionReviews = (snapshot = {}, narrativeReviews = []) => {
  const questions = snapshot.qa || snapshot.questions || [];
  const userTurns = (snapshot.fullTranscript || [])
    .filter((t) => t.role === 'user')
    .map((t) => String(t.content || '').trim())
    .filter(Boolean);

  const byId = new Map(
    (Array.isArray(narrativeReviews) ? narrativeReviews : []).map((r) => [String(r.questionId), r])
  );

  const built = questions.slice(0, QUESTION_REVIEW_MAX).map((q, index) => {
    const narrative = byId.get(String(q.questionId)) || narrativeReviews[index] || {};
    const questionText = q.question || q.text || '';

    // Candidate transcript turn — never trust AI answerExcerpt for gating.
    const candidateAnswer =
      userTurns[index] || (userTurns.length === 1 ? userTurns[0] : '') || '';

    const answerExcerpt = candidateAnswer || narrative.answerExcerpt || '';

    // Phase 1: relevance FIRST (deterministic), before accepting any AI score.
    const classification = evaluateAnswerRelevance(candidateAnswer, questionText);
    const outcome = resolveRelevanceOutcome(classification, {
      narrativeScore: narrative.score,
      narrativeFeedback: narrative.feedback,
    });

    return {
      questionId: q.questionId || `q${index + 1}`,
      question: questionText,
      answerExcerpt: String(answerExcerpt).slice(0, 400),
      score: outcome.score,
      feedback: outcome.feedback,
      followUpNotes: outcome.needsAiScore ? String(narrative.followUpNotes || '').trim() : '',
      focusTag: q.focusTag,
      relevance: classification,
      needsAiScore: outcome.needsAiScore,
      ...(classification !== 'on_topic' ? { relevanceGate: classification } : {}),
    };
  });

  return enforceDeterministicRelevanceGate(built);
};

/**
 * Questions that still need AI scoring (on_topic only).
 * Used to avoid relying on Groq scores for gated answers.
 */
export const selectAnswersNeedingAiScore = (snapshot = {}) => {
  const questions = snapshot.qa || snapshot.questions || [];
  const userTurns = (snapshot.fullTranscript || [])
    .filter((t) => t.role === 'user')
    .map((t) => String(t.content || '').trim())
    .filter(Boolean);

  return questions
    .map((q, index) => {
      const questionText = q.question || q.text || '';
      const answer =
        userTurns[index] || (userTurns.length === 1 ? userTurns[0] : '') || '';
      const classification = evaluateAnswerRelevance(answer, questionText);
      return {
        questionId: q.questionId || `q${index + 1}`,
        question: questionText,
        answer,
        classification,
        needsAiScore: classification === 'on_topic',
      };
    })
    .filter((row) => row.needsAiScore);
};
