import { body } from 'express-validator';
import {
  DEFAULT_MOCK_QUESTION_COUNT,
  INTERVIEW_FOCUS_AREAS,
  INTERVIEW_SETUP_MODES,
  INTERVIEWER_PERSONAS,
  MAX_MOCK_QUESTIONS,
  MIN_MOCK_QUESTIONS,
  MOCK_INTERVIEW_DIFFICULTIES,
  MOCK_INTERVIEW_DURATION_OPTIONS,
  MOCK_INTERVIEW_ROLES,
  MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
} from '../constants/interviewPrepConstants.js';

const roleIds = MOCK_INTERVIEW_ROLES.map((r) => r.id);

export const startLiveInterviewValidation = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Role must be between 2 and 120 characters'),
  body('difficulty')
    .optional()
    .isIn(MOCK_INTERVIEW_DIFFICULTIES)
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('durationMinutes')
    .optional()
    .isIn(MOCK_INTERVIEW_DURATION_OPTIONS)
    .withMessage(
      `Duration must be one of: ${MOCK_INTERVIEW_DURATION_OPTIONS.join(', ')} minutes`
    ),
  body('answerTimeLimitSeconds')
    .optional()
    .isInt({ min: 30, max: 600 })
    .withMessage('Answer time limit must be between 30 and 600 seconds'),
  body('resumeText')
    .optional()
    .isString()
    .isLength({ max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH })
    .withMessage(`Resume text must be at most ${MAX_INTERVIEW_CONTEXT_TEXT_LENGTH} characters`),
  body('jobDescriptionText')
    .optional()
    .isString()
    .isLength({ max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH })
    .withMessage(`Job description must be at most ${MAX_INTERVIEW_CONTEXT_TEXT_LENGTH} characters`),
  body('targetCompany')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Target company must be at most 120 characters'),
  body('experience')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Experience must be at most 120 characters'),
  body('resumeSkills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Resume skills must be an array'),
  body('resumeSkills.*').optional().isString().trim().isLength({ max: 80 }),
  body('resumeProjects')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Resume projects must be an array'),
  body('resumeProjects.*').optional().isString().trim().isLength({ max: 300 }),
  body('focusAreas')
    .optional()
    .isArray({ max: 6 })
    .withMessage('Focus areas must be an array'),
  body('focusAreas.*')
    .optional()
    .isIn(INTERVIEW_FOCUS_AREAS)
    .withMessage('Invalid focus area'),
  body('interviewMode')
    .optional()
    .isIn(INTERVIEW_SETUP_MODES)
    .withMessage('Invalid interview mode'),
  body('interviewerPersona')
    .optional()
    .isIn(INTERVIEWER_PERSONAS)
    .withMessage('Invalid interviewer persona'),
];

export const startMockInterviewValidation = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(roleIds)
    .withMessage('Invalid role'),
  body('difficulty')
    .optional()
    .isIn(MOCK_INTERVIEW_DIFFICULTIES)
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('targetQuestionCount')
    .optional()
    .isInt({ min: MIN_MOCK_QUESTIONS, max: MAX_MOCK_QUESTIONS })
    .withMessage(`Question count must be between ${MIN_MOCK_QUESTIONS} and ${MAX_MOCK_QUESTIONS}`),
  body('answerTimeLimitSeconds')
    .optional()
    .isInt({ min: 30, max: 600 })
    .withMessage('Answer time limit must be between 30 and 600 seconds'),
];

export const sessionIdBodyValidation = [
  body('sessionId').isMongoId().withMessage('Valid session id is required'),
];
export const submitMockAnswerValidation = [
  body('sessionId').isMongoId().withMessage('Valid session id is required'),
  body('questionId').trim().notEmpty().withMessage('Question id is required'),
  body('durationMs')
    .optional()
    .isInt({ min: 0, max: 600000 })
    .withMessage('Invalid duration'),
];

export const nextMockQuestionValidation = [
  body('sessionId').isMongoId().withMessage('Valid session id is required'),
  body('previousAnswerTranscript').optional().isString(),
];

export const submitVoiceCallTranscriptValidation = [
  body('sessionId').isMongoId().withMessage('Valid session id is required'),
  body('transcript')
    .isArray({ min: 1 })
    .withMessage('Transcript must be a non-empty array'),
  body('transcript.*.role').optional().isString(),
  body('transcript.*.content').isString().withMessage('Each transcript entry needs content'),
];

export const roleSuggestionsValidation = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('Query is required')
    .isLength({ min: 1, max: 80 })
    .withMessage('Query must be between 1 and 80 characters'),
];

export const submitLiveInterviewValidation = [
  body('sessionId').isMongoId().withMessage('Valid session id is required'),
  body('transcript')
    .isArray({ min: 1 })
    .withMessage('Transcript must be a non-empty array'),
  body('transcript.*.role').optional().isString(),
  body('transcript.*.content').isString().withMessage('Each transcript entry needs content'),
  body('liveAudioHints').optional().isObject(),
  body('liveVideoMetrics').optional(),
  body('durationMs')
    .optional()
    .isInt({ min: 0, max: 3600000 })
    .withMessage('Invalid call duration'),
];
