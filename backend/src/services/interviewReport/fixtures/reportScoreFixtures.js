/**
 * Phase 0 fixtures for mock-interview report scoring baseline / regression.
 * Shared questions + optimistic Groq narrative (stresses gates/ceilings).
 */

export const FIXTURE_QUESTIONS = [
  {
    questionId: 'q1',
    question: 'How would you design a REST API for user authentication?',
  },
  {
    questionId: 'q2',
    question: 'Explain database indexing and when you would use it.',
  },
  {
    questionId: 'q3',
    question: 'Describe a time you debugged a production incident.',
  },
];

/** High delivery metrics — used to detect voice/presence inflation of overall. */
const HIGH_DELIVERY = {
  callSpeechMetrics: {
    communicationScore: 88,
    fluency: 85,
    speakingConfidence: 90,
    speechSpeed: 140,
    fillerWords: 2,
  },
  behavioralMetrics: {
    attentionScore: 80,
    distractionScore: 10,
  },
  summary: {
    averageConfidenceScore: 88,
    averageEngagementScore: 76,
    averageWpm: 140,
    totalFillerWords: 2,
    averageEyeContactPercent: 72,
    averagePauseRatio: 0.12,
  },
};

/** Optimistic AI narrative (what Groq might return even for weak answers). */
export const OPTIMISTIC_NARRATIVE = {
  dimensions: {
    communication: 78,
    communicationFeedback: 'Clear delivery overall.',
    technicalSkills: 72,
    technicalSkillsFeedback: 'Solid technical framing.',
    behavior: 74,
    behaviorFeedback: 'Engaged presence.',
    confidence: 80,
    confidenceFeedback: 'Sounds confident.',
    leadership: 68,
    leadershipFeedback: 'Some ownership signals.',
    problemSolving: 70,
    problemSolvingFeedback: 'Reasonable problem framing.',
    criticalThinking: 69,
    criticalThinkingFeedback: 'Thoughtful structure.',
    contentQualityScore: 71,
  },
  questionReviews: FIXTURE_QUESTIONS.map((q) => ({
    questionId: q.questionId,
    score: 70,
    feedback: 'Generally solid answer.',
    answerExcerpt: '',
    followUpNotes: '',
  })),
  hiring: {
    decision: 'lean_hire',
    rationale: 'AI suggested lean hire based on delivery.',
    confidence: 72,
  },
  strengths: ['Strong communication', 'Clear spoken delivery'],
  weaknesses: [],
  improvementAreas: [],
  legacyAiReport: {
    overallScore: 74,
    sections: {
      contentQuality: { score: 71, feedback: 'Good substance.' },
      voiceAnalysis: {
        wpm: 140,
        confidenceScore: 88,
        fillerWords: 2,
        feedback: 'Clear voice.',
      },
      videoAnalysis: {
        eyeContactPercent: 72,
        engagementScore: 76,
        feedback: 'Good camera presence.',
      },
    },
    strengths: ['Strong communication'],
    improvementAreas: [],
    recommendedNextSteps: ['Keep practicing system design'],
  },
  executiveSummary: {
    headline: 'Promising session',
    summary: 'Candidate showed potential.',
    keyTakeaways: ['Good pacing'],
  },
};

const baseSnapshot = (userTurns) => ({
  mode: 'live',
  role: 'backend',
  roleLabel: 'Backend Developer',
  difficulty: 'medium',
  durationMinutes: 15,
  targetQuestionCount: FIXTURE_QUESTIONS.length,
  qa: FIXTURE_QUESTIONS.map((q) => ({ ...q })),
  fullTranscript: userTurns.map((content) => ({ role: 'user', content })),
  ...HIGH_DELIVERY,
});

export const REPORT_SCORE_FIXTURES = {
  all_empty: {
    id: 'all_empty',
    description: 'Every answer blank / near-empty',
    snapshot: baseSnapshot(['', '  ', 'hi']),
    narrative: OPTIMISTIC_NARRATIVE,
  },

  all_gibberish: {
    id: 'all_gibberish',
    description: 'Every answer random / off-topic gibberish',
    snapshot: baseSnapshot([
      'asdf qwer zxcv',
      'blah blah blah blah',
      'I really love pizza and going to the beach on weekends with friends.',
    ]),
    narrative: OPTIMISTIC_NARRATIVE,
  },

  all_strong: {
    id: 'all_strong',
    description: 'Every answer relevant and detailed',
    snapshot: baseSnapshot([
      'I would design a REST API with JWT authentication, login and refresh token endpoints, password hashing with bcrypt, and rate limiting on auth routes.',
      'Database indexing speeds up lookups on frequently queried columns. I use indexes on foreign keys and unique constraints, and avoid over-indexing write-heavy tables.',
      'In production I once traced a memory leak with heap dumps, found an unbounded cache, added a TTL, and rolled out a fix with monitoring alerts.',
    ]),
    narrative: OPTIMISTIC_NARRATIVE,
  },

  mixed: {
    id: 'mixed',
    description: 'Some good answers, some bad',
    snapshot: baseSnapshot([
      'I would design a REST API with JWT authentication, login and refresh token endpoints, and secure password storage.',
      'asdf qwer zxcv',
      '',
    ]),
    narrative: OPTIMISTIC_NARRATIVE,
  },

  question_echo: {
    id: 'question_echo',
    description: 'Answers that just repeat the question text',
    snapshot: baseSnapshot([
      'How would you design a REST API for user authentication?',
      'Explain database indexing and when you would use it.',
      'Describe a time you debugged a production incident.',
    ]),
    narrative: OPTIMISTIC_NARRATIVE,
  },
};

export const FIXTURE_IDS = Object.keys(REPORT_SCORE_FIXTURES);
