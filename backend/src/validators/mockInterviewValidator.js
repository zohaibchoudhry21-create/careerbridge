import { body } from 'express-validator';
import {
  DEFAULT_MOCK_QUESTION_COUNT,
  MAX_MOCK_QUESTIONS,
  MIN_MOCK_QUESTIONS,
  MOCK_INTERVIEW_DIFFICULTIES,
  MOCK_INTERVIEW_ROLES,
} from '../constants/interviewPrepConstants.js';

const roleIds = MOCK_INTERVIEW_ROLES.map((r) => r.id);

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
