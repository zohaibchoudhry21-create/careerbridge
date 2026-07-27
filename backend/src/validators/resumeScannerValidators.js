import { body, param } from 'express-validator';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

const MAX_JOB_DESCRIPTION_LENGTH = 20000;
const MAX_RESUME_TEXT_LENGTH = 30000;

export const uploadResumeScannerValidation = [
  body('jobDescription')
    .trim()
    .notEmpty()
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED))
    .isLength({ max: MAX_JOB_DESCRIPTION_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_TOO_LONG, {
        max: MAX_JOB_DESCRIPTION_LENGTH,
      })
    ),
  body('mode')
    .optional()
    .isIn(['upload', 'saved'])
    .withMessage(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC)),
  body('resumeSourceType')
    .if(body('mode').equals('saved'))
    .isIn(['built', 'scanned'])
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.INVALID_RESUME_SOURCE)),
  body('resumeSourceId')
    .if(body('mode').equals('saved'))
    .notEmpty()
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.RESUME_INPUT_REQUIRED)),
];

export const analysisIdValidation = [
  param('analysisId').isMongoId().withMessage(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC)),
];

export const suggestionActionValidation = [
  ...analysisIdValidation,
  param('suggestionId')
    .trim()
    .notEmpty()
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.SUGGESTION_NOT_FOUND)),
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.INVALID_SUGGESTION_ACTION)),
];

export const updateResumeTextValidation = [
  ...analysisIdValidation,
  body('resumeText')
    .isString()
    .trim()
    .notEmpty()
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY))
    .isLength({ max: MAX_RESUME_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.VALIDATION.FIELD_MAX_LENGTH, { max: MAX_RESUME_TEXT_LENGTH })
    ),
];
