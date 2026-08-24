import { body, param, query } from 'express-validator';
import {
  INTERVIEW_FOCUS_AREAS,
  INTERVIEW_FORMATS,
  INTERVIEW_SETUP_MODES_SELECTABLE,
  INTERVIEWER_PERSONAS,
  MOCK_INTERVIEW_DIFFICULTIES,
  MIN_MOCK_INTERVIEW_DURATION_MINUTES,
  MAX_MOCK_INTERVIEW_DURATION_MINUTES,
  MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
} from '../constants/interviewPrepConstants.js';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

export const startLiveInterviewValidation = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.INTERVIEW_PREP.ROLE_REQUIRED)
    .isLength({ min: 2, max: 120 })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.ROLE_LENGTH, { min: 2, max: 120 })
    ),
  body('difficulty')
    .optional()
    .isIn(MOCK_INTERVIEW_DIFFICULTIES)
    .withMessage(ERROR_CODES.INTERVIEW_PREP.DIFFICULTY_INVALID),
  body('durationMinutes')
    .optional()
    .isInt({ min: MIN_MOCK_INTERVIEW_DURATION_MINUTES, max: MAX_MOCK_INTERVIEW_DURATION_MINUTES })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.DURATION_INVALID, {
        min: MIN_MOCK_INTERVIEW_DURATION_MINUTES,
        max: MAX_MOCK_INTERVIEW_DURATION_MINUTES,
      })
    )
    .toInt(),
  body('answerTimeLimitSeconds')
    .optional()
    .isInt({ min: 30, max: 600 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.ANSWER_TIME_LIMIT_INVALID),
  body('resumeText')
    .optional()
    .isString()
    .isLength({ max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.RESUME_TEXT_TOO_LONG, {
        max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
      })
    ),
  body('jobDescriptionText')
    .optional()
    .isString()
    .isLength({ max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.JOB_DESCRIPTION_TOO_LONG, {
        max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
      })
    ),
  body('targetCompany')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.TARGET_COMPANY_TOO_LONG),
  body('experience')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.EXPERIENCE_TOO_LONG),
  body('resumeSkills')
    .optional()
    .isArray({ max: 20 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.RESUME_SKILLS_ARRAY),
  body('resumeSkills.*').optional().isString().trim().isLength({ max: 80 }),
  body('resumeProjects')
    .optional()
    .isArray({ max: 10 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.RESUME_PROJECTS_ARRAY),
  body('resumeProjects.*').optional().isString().trim().isLength({ max: 300 }),
  body('focusAreas')
    .optional()
    .isArray({ max: 6 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.FOCUS_AREAS_ARRAY),
  body('focusAreas.*')
    .optional()
    .isIn(INTERVIEW_FOCUS_AREAS)
    .withMessage(ERROR_CODES.INTERVIEW_PREP.FOCUS_AREA_INVALID),
  body('interviewMode')
    .optional()
    .isIn(INTERVIEW_SETUP_MODES_SELECTABLE)
    .withMessage(ERROR_CODES.INTERVIEW_PREP.INTERVIEW_MODE_INVALID),
  body('interviewFormat')
    .optional()
    .isIn(INTERVIEW_FORMATS)
    .withMessage(ERROR_CODES.INTERVIEW_PREP.INTERVIEW_FORMAT_INVALID),
  body('interviewerPersona')
    .optional()
    .isIn(INTERVIEWER_PERSONAS)
    .withMessage(ERROR_CODES.INTERVIEW_PREP.INTERVIEWER_PERSONA_INVALID),
];

export const panelPreviewSeatsValidation = [
  query('roleLabel')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.ROLE_LENGTH, { min: 0, max: 120 })
    ),
];

export const sessionIdBodyValidation = [
  body('sessionId').isMongoId().withMessage(ERROR_CODES.VALIDATION.SESSION_ID_INVALID),
];

export const sessionIdParamValidation = [
  param('sessionId').isMongoId().withMessage(ERROR_CODES.VALIDATION.SESSION_ID_INVALID),
];

export const roleSuggestionsValidation = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.INTERVIEW_PREP.QUERY_REQUIRED)
    .isLength({ min: 1, max: 80 })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.QUERY_LENGTH, { min: 1, max: 80 })
    ),
];

export const submitLiveInterviewValidation = [
  body('sessionId').isMongoId().withMessage(ERROR_CODES.VALIDATION.SESSION_ID_INVALID),
  body('transcript')
    .isArray({ min: 1, max: 400 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_ARRAY),
  body('transcript.*.role').optional().isString(),
  body('transcript.*.content')
    .isString()
    .withMessage(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_CONTENT_REQUIRED)
    .isLength({ max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_TOO_LONG, {
        max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
      })
    ),
  body('liveAudioHints').optional().isObject(),
  body('liveAudioHints.acousticSamples')
    .optional()
    .isArray({ max: 2400 })
    .withMessage(ERROR_CODES.VALIDATION.GENERIC),
  body('liveAudioHints.pauseEvents')
    .optional()
    .isArray({ max: 200 })
    .withMessage(ERROR_CODES.VALIDATION.GENERIC),
  body('liveVideoMetrics').optional().isObject(),
  body('liveVideoMetrics.frameSamples')
    .optional()
    .isArray({ max: 4000 })
    .withMessage(ERROR_CODES.VALIDATION.GENERIC),
  body('durationMs')
    .optional()
    .isInt({
      min: 0,
      max: MAX_MOCK_INTERVIEW_DURATION_MINUTES * 60 * 1000 + 5 * 60 * 1000,
    })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.CALL_DURATION_INVALID),
];

export const adaptiveDepthValidation = [
  body('sessionId').isMongoId().withMessage(ERROR_CODES.VALIDATION.SESSION_ID_INVALID),
  body('answerText')
    .isString()
    .withMessage(ERROR_CODES.VALIDATION.GENERIC)
    .isLength({ max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_TOO_LONG, {
        max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
      })
    ),
  body('questionText').optional().isString().isLength({ max: 2000 }),
  body('answeredCount').optional().isInt({ min: 0, max: 20 }),
  body('priorStrengths').optional().isArray({ max: 4 }),
  body('priorStrengths.*').optional().isIn(['strong', 'weak', 'neutral']),
];
