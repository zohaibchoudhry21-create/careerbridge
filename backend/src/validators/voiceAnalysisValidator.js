import { body } from 'express-validator';

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
    throw new Error('Provide an audio file or transcript for voice analysis.');
  }),
];
