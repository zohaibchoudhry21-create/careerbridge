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
 * @typedef {Object} SpeechTimelineEvent
 * @property {number} tMs
 * @property {string} offsetLabel
 * @property {string} type
 * @property {string} message
 * @property {'info'|'warning'|'critical'} [severity]
 */

/**
 * @typedef {Object} SpeechMetrics
 * @property {number} [speechSpeed]
 * @property {number|null} [speakingConfidence]
 * @property {number|null} [energy]
 * @property {number|null} [pitchStability]
 * @property {number|null} [volumeStability]
 * @property {number|null} [pronunciationScore]
 * @property {number|null} [fluency]
 * @property {number|null} [grammarQuality]
 * @property {number|null} [vocabularyQuality]
 * @property {number|null} [stressScore]
 * @property {number|null} [speakingConsistency]
 * @property {number|null} [communicationScore]
 * @property {number} [fillerWords]
 * @property {Object} [longPauses]
 * @property {Object} [shortPauses]
 * @property {Object} [thinkingTime]
 * @property {Object} [emotion]
 * @property {Object} [sources]
 */

/**
 * @typedef {Object} BehavioralTimelineEvent
 * @property {number} tMs
 * @property {string} offsetLabel
 * @property {string} type
 * @property {string} message
 * @property {'info'|'warning'|'critical'} [severity]
 */

/**
 * @typedef {Object} VideoMetrics
 * @property {number} [eyeContactPercent]
 * @property {Record<string, number>} [expressionBreakdown]
 * @property {number} [engagementScore]
 * @property {number} [attentionScore]
 * @property {Array<Record<string, unknown>>} [timeline]
 * @property {string} [feedbackText]
 * @property {Record<string, unknown>} [behavioralMetrics]
 * @property {BehavioralTimelineEvent[]} [timelineEvents]
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
