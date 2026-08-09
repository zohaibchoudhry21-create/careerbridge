import { describe, expect, it } from 'vitest';
import {
  buildQuestionReviews,
  detectIrrelevantAnswer,
  IRRELEVANT_ANSWER_SCORE,
} from './questionReviewBuilder.js';
import { RELEVANCE_FIXED_OUTCOMES } from './evaluateAnswerRelevance.js';
import {
  applyContentCeiling,
  applyMaxDeliveryInfluence,
  buildOverallScore,
  computeContentScoreCeiling,
  MAX_DELIVERY_INFLUENCE_ON_OVERALL,
  resolveContentAverage,
} from './overallScoreBuilder.js';
import { assembleInterviewReport } from '../reportAssembler.js';
import {
  applyAiFineTune,
  averageQuestionReviewScore,
  buildDimensionScores,
  CONTENT_DIMENSIONS,
  resolveContentBaseFromQuestions,
} from './dimensionScoresBuilder.js';
import { buildHiringSections, scaleHiringProbability } from './hiringBuilder.js';
import {
  buildStrengthsWeaknesses,
  filterNarrativeStrengths,
  WEAK_DIM_STRENGTH_THRESHOLD,
} from './strengthsWeaknessesBuilder.js';

describe('detectIrrelevantAnswer', () => {
  const question = 'How would you design a REST API for user authentication?';

  it('flags empty and near-empty answers', () => {
    expect(detectIrrelevantAnswer(question, '')).toBe('empty');
    expect(detectIrrelevantAnswer(question, '   hi   ')).toBe('empty');
  });

  it('flags gibberish and repeated words', () => {
    expect(detectIrrelevantAnswer(question, 'asdf qwer zxcv')).toBe('gibberish');
    expect(detectIrrelevantAnswer(question, 'blah blah blah blah')).toBe('gibberish');
  });

  it('flags off-topic answers with no keyword overlap', () => {
    expect(
      detectIrrelevantAnswer(question, 'I really love pizza and going to the beach on weekends.')
    ).toBe('off_topic');
  });

  it('flags question-echo / keyword stuffing', () => {
    expect(detectIrrelevantAnswer(question, question)).toBe('question_echo');
  });

  it('allows on-topic answers', () => {
    expect(
      detectIrrelevantAnswer(
        question,
        'I would design a REST API with JWT authentication, login and refresh token endpoints.'
      )
    ).toBeNull();
  });
});

describe('buildQuestionReviews relevance gate', () => {
  it('overrides high AI scores for empty/gibberish answers', () => {
    const reviews = buildQuestionReviews(
      {
        qa: [{ questionId: 'q1', question: 'Explain database indexing.' }],
        fullTranscript: [{ role: 'user', content: 'asdf qwer zxcv' }],
      },
      [{ questionId: 'q1', score: 72, feedback: 'Solid answer with good structure.' }]
    );

    expect(reviews[0].needsAiScore).toBe(false);
    expect(['gibberish', 'off_topic']).toContain(reviews[0].relevance);
    expect(reviews[0].score).toBe(RELEVANCE_FIXED_OUTCOMES[reviews[0].relevance].score);
  });
});

describe('Phase 2 content-base dimension scoring', () => {
  it('clamps AI narrative within ±10 of question content base', () => {
    expect(applyAiFineTune(2, 78, 10)).toBe(4); // near-zero: max base+2
    expect(applyAiFineTune(70, 78, 10)).toBe(78);
    expect(applyAiFineTune(70, 50, 10)).toBe(60);
    expect(applyAiFineTune(0, 90, 10)).toBe(2);
  });

  it('resolves content base to 0 when questions expected but scores missing', () => {
    expect(resolveContentBaseFromQuestions([], 3)).toBe(0);
    expect(resolveContentBaseFromQuestions([], 0)).toBeNull();
  });

  it('keeps content dimensions near-zero when all question scores are gated', () => {
    const questionReviews = [
      { score: IRRELEVANT_ANSWER_SCORE },
      { score: 0 },
      { score: 1 },
    ];
    const contentBase = averageQuestionReviewScore(questionReviews);
    expect(contentBase).toBeLessThanOrEqual(5);

    const dims = buildDimensionScores(
      {
        callSpeechMetrics: {
          communicationScore: 88,
          speakingConfidence: 90,
          fluency: 85,
        },
        behavioralMetrics: { attentionScore: 80, distractionScore: 10 },
        summary: { averageConfidenceScore: 88, averageEngagementScore: 76 },
        qa: [{ questionId: 'q1' }, { questionId: 'q2' }, { questionId: 'q3' }],
      },
      {
        communication: 78,
        technicalSkills: 72,
        behavior: 74,
        leadership: 68,
        problemSolving: 70,
        criticalThinking: 69,
        confidence: 85,
      },
      { questionReviews }
    );

    for (const key of CONTENT_DIMENSIONS) {
      expect(dims[key].score).toBeLessThanOrEqual(contentBase + 10);
      expect(dims[key].score).toBeLessThanOrEqual(15);
    }
    expect(dims.confidence.score).toBeLessThanOrEqual(15);
  });

  it('pulls mixed sessions down via question average (not old 20-threshold hole)', () => {
    const questionReviews = [{ score: 70 }, { score: 1 }, { score: 0 }];
    const contentBase = averageQuestionReviewScore(questionReviews);
    expect(contentBase).toBeGreaterThan(20);

    const dims = buildDimensionScores(
      {
        qa: [{ questionId: 'q1' }, { questionId: 'q2' }, { questionId: 'q3' }],
        callSpeechMetrics: { communicationScore: 88, speakingConfidence: 90 },
        summary: { averageConfidenceScore: 88 },
      },
      {
        communication: 78,
        technicalSkills: 72,
        behavior: 74,
        leadership: 68,
        problemSolving: 70,
        criticalThinking: 69,
        confidence: 85,
      },
      { questionReviews }
    );

    for (const key of CONTENT_DIMENSIONS) {
      expect(dims[key].score).toBeLessThanOrEqual(contentBase + 10);
      expect(dims[key].score).toBeGreaterThanOrEqual(contentBase - 10);
    }
    // Must not stay at optimistic AI 70+ when avg is pulled by bad answers
    expect(dims.technicalSkills.score).toBeLessThanOrEqual(contentBase + 10);
  });
});

describe('resolveContentAverage empty reviews', () => {
  it('treats missing review scores as 0 when questions were expected', () => {
    expect(resolveContentAverage([], {}, { expectedQuestionCount: 4 })).toBe(0);
    expect(computeContentScoreCeiling(0)).toBe(1);
  });

  it('skips hard-zero when no questions were expected', () => {
    expect(resolveContentAverage([], {}, { expectedQuestionCount: 0 })).toBeNull();
  });
});

describe('buildOverallScore Phase 5 direct formula', () => {
  it('caps delivery inflation helper to MAX_DELIVERY_INFLUENCE_ON_OVERALL', () => {
    expect(MAX_DELIVERY_INFLUENCE_ON_OVERALL).toBe(10);
    expect(applyMaxDeliveryInfluence(30, 90)).toBe(40);
    expect(applyMaxDeliveryInfluence(30, 35)).toBe(35);
  });

  it('keeps overall near-zero when content dimensions are near-zero (delivery ignored)', () => {
    const overall = buildOverallScore({
      dimensions: {
        communication: { score: 2 },
        technicalSkills: { score: 2 },
        behavior: { score: 2 },
        confidence: { score: 80 },
        leadership: { score: 2 },
        problemSolving: { score: 2 },
        criticalThinking: { score: 2 },
      },
      voiceSection: { score: 90 },
      eyeContactSection: { score: 88 },
      bodyLanguageSection: { score: 85 },
      legacyOverall: 78,
      questionReviews: [{ score: 1 }, { score: 1 }, { score: 1 }],
      expectedQuestionCount: 3,
    });

    expect(overall).toBeLessThanOrEqual(5);
  });

  it('adds capped delivery bonus when content is healthy', () => {
    const overall = buildOverallScore({
      dimensions: {
        communication: { score: 70 },
        technicalSkills: { score: 70 },
        behavior: { score: 70 },
        confidence: { score: 70 },
        leadership: { score: 70 },
        problemSolving: { score: 70 },
        criticalThinking: { score: 70 },
      },
      voiceSection: { score: 100 },
      eyeContactSection: { score: 100 },
      bodyLanguageSection: { score: 100 },
      expectedQuestionCount: 3,
    });

    // contentCore 70 + full delivery bonus 10
    expect(overall).toBe(80);
  });

  it('does not apply legacy content ceiling helper when content is healthy', () => {
    expect(applyContentCeiling(72, 55)).toBe(72);
  });
});

describe('hiringBuilder rule-based decision', () => {
  it('ignores AI narrative.decision override', () => {
    const hiring = buildHiringSections(
      3,
      { communication: { label: 'Communication', score: 2 } },
      { decision: 'lean_hire', rationale: 'AI wants hire', confidence: 90 }
    );
    expect(hiring.hiringRecommendation.decision).toBe('no_hire');
    expect(hiring.hiringProbability.percent).toBe(3);
  });

  it('scales probability proportionally with overall', () => {
    expect(scaleHiringProbability(3)).toBe(3);
    expect(scaleHiringProbability(44)).toBe(44);
    expect(scaleHiringProbability(100)).toBe(95);
  });
});

describe('assembleInterviewReport with irrelevant answers', () => {
  it('keeps content dimensions near-zero when every answer is gibberish', () => {
    const assembled = assembleInterviewReport(
      {
        mode: 'live',
        role: 'backend',
        roleLabel: 'Backend Developer',
        difficulty: 'medium',
        qa: [
          { questionId: 'q1', question: 'Explain REST API design.' },
          { questionId: 'q2', question: 'How do you handle database indexing?' },
        ],
        fullTranscript: [
          { role: 'user', content: 'asdf qwer zxcv' },
          { role: 'user', content: 'blah blah blah blah' },
        ],
        callSpeechMetrics: {
          communicationScore: 88,
          fluency: 85,
          speakingConfidence: 90,
        },
        behavioralMetrics: { attentionScore: 80 },
        summary: {
          averageConfidenceScore: 88,
          averageEngagementScore: 76,
          averageWpm: 140,
          totalFillerWords: 2,
        },
      },
      {
        dimensions: {
          communication: 88,
          technicalSkills: 47,
          behavior: 76,
          confidence: 90,
          leadership: 70,
          problemSolving: 65,
          criticalThinking: 60,
        },
        hiring: { decision: 'lean_hire', rationale: 'Should not win', confidence: 80 },
        questionReviews: [
          { questionId: 'q1', score: 80, feedback: 'Good' },
          { questionId: 'q2', score: 75, feedback: 'Fine' },
        ],
        strengths: ['Strong communication'],
        legacyAiReport: {
          overallScore: 78,
          sections: {
            contentQuality: { score: 70, feedback: '' },
            voiceAnalysis: { wpm: 140, confidenceScore: 88, fillerWords: 2, feedback: '' },
            videoAnalysis: { eyeContactPercent: 70, engagementScore: 76, feedback: '' },
          },
          strengths: ['Strong communication'],
          improvementAreas: [],
          recommendedNextSteps: [],
        },
      }
    );

    const dims = assembled.enterpriseReport.dimensions;
    for (const key of CONTENT_DIMENSIONS) {
      expect(dims[key].score).toBeLessThanOrEqual(15);
    }
    expect(assembled.overallScore).toBeLessThanOrEqual(5);
    expect(assembled.enterpriseReport.hiringRecommendation.decision).toBe('no_hire');
  });
});

describe('Phase 6 strengths consistency filter', () => {
  it(`moves AI strengths that name dimensions scoring < ${WEAK_DIM_STRENGTH_THRESHOLD}`, () => {
    const { keep, moved } = filterNarrativeStrengths(
      ['Strong communication', 'Great camera presence', 'Solid technical depth'],
      {
        communication: { label: 'Communication', score: 3 },
        technicalSkills: { label: 'Technical Skills', score: 3 },
        behavior: { label: 'Behavior', score: 40 },
      }
    );
    expect(keep).toEqual(['Great camera presence']);
    expect(moved.length).toBe(2);
    expect(moved.some((m) => /Communication/i.test(m))).toBe(true);
    expect(moved.some((m) => /Technical Skills/i.test(m))).toBe(true);
  });

  it('does not surface contradictory AI strengths when overall is near-zero', () => {
    const lists = buildStrengthsWeaknesses({
      dimensions: {
        communication: { label: 'Communication', score: 2 },
        technicalSkills: { label: 'Technical Skills', score: 2 },
        behavior: { label: 'Behavior', score: 2 },
        confidence: { label: 'Confidence', score: 15 },
        leadership: { label: 'Leadership', score: 2 },
        problemSolving: { label: 'Problem Solving', score: 2 },
        criticalThinking: { label: 'Critical Thinking', score: 2 },
      },
      voiceSection: { score: 88 },
      narrative: { strengths: ['Strong communication', 'Clear spoken delivery'] },
      overallScore: 2,
      contentCeilingApplied: true,
    });
    expect(lists.strengths.every((s) => !/communication/i.test(s))).toBe(true);
    expect(lists.strengths).not.toContain('Clear spoken delivery');
    expect(lists.weaknesses.some((w) => /Communication/i.test(w))).toBe(true);
  });
});
