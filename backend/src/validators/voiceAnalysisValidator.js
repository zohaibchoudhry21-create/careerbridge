import { body } from 'express-validator';
import { MAX_VOICE_AUDIO_DURATION_MS } from '../constants/interviewPrepConstants.js';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

export const analyzeVoiceValidation = [
  body('transcript').optional().isString(),
  body('duration')
    .optional()
    .isFloat({ min: 0, max: MAX_VOICE_AUDIO_DURATION_MS / 1000 })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.AUDIO_TOO_LONG, {
        maxMinutes: Math.round(MAX_VOICE_AUDIO_DURATION_MS / 60000),
      })
    ),
  body('durationMs')
    .optional()
    .isInt({ min: 0, max: MAX_VOICE_AUDIO_DURATION_MS })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.AUDIO_TOO_LONG, {
        maxMinutes: Math.round(MAX_VOICE_AUDIO_DURATION_MS / 60000),
      })
    ),
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
