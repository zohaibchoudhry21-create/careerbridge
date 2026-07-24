import { body } from 'express-validator';

export const analyzeVideoValidation = [
  body('frameSamples').isArray({ min: 1 }).withMessage('frameSamples must be a non-empty array'),
  body('frameSamples.*.eyeContactPercent').optional().isFloat({ min: 0, max: 100 }),
];
