import { body, param } from 'express-validator';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

const MAX_JOB_DESCRIPTION_LENGTH = 20000;
const MAX_RESUME_TEXT_LENGTH = 30000;

const FORBIDDEN_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

const pathHasForbiddenSegment = (path = '') =>
  String(path)
    .split('.')
    .some((segment) => FORBIDDEN_PATH_SEGMENTS.has(segment));

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
    .isIn(['upload'])
    .withMessage(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC)),
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

export const rewriteActionValidation = [
  ...analysisIdValidation,
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.INVALID_REWRITE_ACTION)),
];

export const updateResumeTextValidation = [
  ...analysisIdValidation,
  body().custom((_value, { req }) => {
    const hasStructured =
      req.body?.structuredResume && typeof req.body.structuredResume === 'object';
    const hasParsed = req.body?.parsedData && typeof req.body.parsedData === 'object';
    const hasPath = typeof req.body?.path === 'string' && req.body.path.trim();
    const hasValue = Object.prototype.hasOwnProperty.call(req.body || {}, 'value');
    const hasText = typeof req.body?.resumeText === 'string' && req.body.resumeText.trim();
    const hasTemplateOnly =
      typeof req.body?.templateId === 'string' &&
      ['classic', 'modern', 'minimal', 'professional', 'elegant'].includes(req.body.templateId);

    if (hasStructured || (hasPath && hasValue) || hasText || hasParsed || hasTemplateOnly) {
      return true;
    }

    throw new Error(formatValidationCode(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY));
  }),
  body('resumeText')
    .optional()
    .isString()
    .isLength({ max: MAX_RESUME_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.VALIDATION.FIELD_MAX_LENGTH, { max: MAX_RESUME_TEXT_LENGTH })
    ),
  body('path')
    .optional()
    .isString()
    .trim()
    .custom((value) => {
      if (value && pathHasForbiddenSegment(value)) {
        throw new Error(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC));
      }
      return true;
    }),
  body('structuredResume').optional().isObject(),
  body('parsedData').optional().isObject(),
  body('templateId')
    .optional()
    .isIn(['classic', 'modern', 'minimal', 'professional', 'elegant'])
    .withMessage(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC)),
];
