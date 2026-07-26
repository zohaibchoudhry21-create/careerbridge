import { body } from 'express-validator';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';

export const analyzeVoiceValidation = [
  body('transcript').optional().isString(),
  body('duration').optional().isFloat({ min: 0 }),
  body('durationMs').optional().isInt({ min: 0 }),
  body().custom((_, { req }) => {
    if (req.file?.buffer) {
      return true;
    }
    if (req.body?.transcript?.trim()) {
      return true;
    }
    throw new Error(ERROR_CODES.INTERVIEW_PREP.VOICE_INPUT_REQUIRED);
  }),
];
