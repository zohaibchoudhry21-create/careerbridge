/**
 * Interview Prep domain types (JSDoc).
 */

/**
 * @typedef {'easy' | 'medium' | 'hard'} InterviewDifficulty
 */

/**
 * @typedef {'setup' | 'active' | 'processing' | 'completed' | 'abandoned'} MockInterviewStatus
 */

/**
 * @typedef {'pending' | 'in_progress' | 'submitted'} SkillQuizStatus
 */

/**
 * @typedef {'mock_interview' | 'skill_assessment'} InterviewReportSourceType
 */

/**
 * @typedef {Object} VoiceMetrics
 * @property {number} [wpm]
 * @property {number} [fillerWords]
 * @property {number} [pauseRatio]
 * @property {number} [confidenceScore]
 * @property {string} [toneLabel]
 * @property {string} [feedbackText]
 */

/**
 * @typedef {Object} VideoMetrics
 * @property {number} [eyeContactPercent]
 * @property {Record<string, number>} [expressionBreakdown]
 * @property {number} [engagementScore]
 * @property {Array<Record<string, unknown>>} [timeline]
 * @property {string} [feedbackText]
 */

/**
 * @typedef {Object} InterviewReportPayload
 * @property {string} sessionId
 * @property {InterviewReportSourceType} type
 * @property {number} overallScore
 * @property {Object} sections
 * @property {string[]} strengths
 * @property {string[]} improvementAreas
 * @property {string[]} recommendedNextSteps
 */

export {};
