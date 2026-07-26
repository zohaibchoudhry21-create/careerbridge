import { body } from 'express-validator';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';

export const analyzeVideoValidation = [
  body('frameSamples')
    .isArray({ min: 1 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.FRAME_SAMPLES_ARRAY),
  body('frameSamples.*.eyeContactPercent').optional().isFloat({ min: 0, max: 100 }),
];
