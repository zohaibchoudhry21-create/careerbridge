import { describe, expect, it } from 'vitest';
import {
  evaluateAnswerRelevance,
  resolveRelevanceOutcome,
  RELEVANCE_FIXED_OUTCOMES,
} from './evaluateAnswerRelevance.js';

describe('evaluateAnswerRelevance', () => {
  const question = 'How would you design a REST API for user authentication?';

  it('classifies empty / near-empty', () => {
    expect(evaluateAnswerRelevance('', question)).toBe('empty');
    expect(evaluateAnswerRelevance('hi', question)).toBe('empty');
  });

  it('classifies gibberish', () => {
    expect(evaluateAnswerRelevance('asdf qwer zxcv', question)).toBe('gibberish');
    expect(evaluateAnswerRelevance('blah blah blah blah', question)).toBe('gibberish');
  });

  it('classifies question_echo', () => {
    expect(evaluateAnswerRelevance(question, question)).toBe('question_echo');
  });

  it('classifies off_topic', () => {
    expect(
      evaluateAnswerRelevance(
        'I really love pizza and going to the beach on weekends with friends.',
        question
      )
    ).toBe('off_topic');
  });

  it('classifies on_topic', () => {
    expect(
      evaluateAnswerRelevance(
        'I would design a REST API with JWT authentication, login and refresh token endpoints.',
        question
      )
    ).toBe('on_topic');
  });
});

describe('resolveRelevanceOutcome', () => {
  it('uses fixed outcomes and skips AI for non-on_topic', () => {
    const empty = resolveRelevanceOutcome('empty', { narrativeScore: 90, narrativeFeedback: 'Great' });
    expect(empty.needsAiScore).toBe(false);
    expect(empty.score).toBe(RELEVANCE_FIXED_OUTCOMES.empty.score);
    expect(empty.feedback).toBe(RELEVANCE_FIXED_OUTCOMES.empty.feedback);
  });

  it('uses narrative score only for on_topic', () => {
    const onTopic = resolveRelevanceOutcome('on_topic', {
      narrativeScore: 72,
      narrativeFeedback: 'Solid answer.',
    });
    expect(onTopic.needsAiScore).toBe(true);
    expect(onTopic.score).toBe(72);
    expect(onTopic.feedback).toBe('Solid answer.');
  });
});
