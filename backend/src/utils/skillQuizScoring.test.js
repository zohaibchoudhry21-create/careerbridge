import { describe, expect, it } from 'vitest';
import { buildReviewList, computeWeakAreas, scoreSkillQuiz } from './skillQuizScoring.js';

const questions = [
  {
    questionId: 'q1',
    question: 'Q1',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 1,
    subtopic: 'closures',
    explanation: 'e1',
  },
  {
    questionId: 'q2',
    question: 'Q2',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    subtopic: 'closures',
    explanation: 'e2',
  },
  {
    questionId: 'q3',
    question: 'Q3',
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 2,
    subtopic: 'async',
    explanation: 'e3',
  },
];

const answers = [
  { questionId: 'q1', selectedIndex: 1 },
  { questionId: 'q2', selectedIndex: 2 },
  { questionId: 'q3', selectedIndex: 2 },
];

describe('scoreSkillQuiz', () => {
  it('scores answers and builds per-question rows', () => {
    const scored = scoreSkillQuiz(questions, answers);
    expect(scored.score).toBe(2);
    expect(scored.total).toBe(3);
    expect(scored.percentage).toBe(67);
    expect(scored.perQuestion).toHaveLength(3);
  });
});

describe('computeWeakAreas', () => {
  it('groups by subtopic and sorts by lowest accuracy first', () => {
    const scored = scoreSkillQuiz(questions, answers);
    const weak = computeWeakAreas(scored.perQuestion);

    expect(weak[0].subtopic).toBe('closures');
    expect(weak.find((w) => w.subtopic === 'closures')).toMatchObject({
      correct: 1,
      total: 2,
      accuracy: 50,
    });
    expect(weak.find((w) => w.subtopic === 'async')).toMatchObject({
      correct: 1,
      total: 1,
      accuracy: 100,
    });
  });
});

describe('buildReviewList', () => {
  it('returns only incorrect questions for review', () => {
    const scored = scoreSkillQuiz(questions, answers);
    const review = buildReviewList(scored.perQuestion);

    expect(review).toHaveLength(1);
    expect(review[0].questionId).toBe('q2');
  });
});
