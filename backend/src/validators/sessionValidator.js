import { body, param } from 'express-validator';

export const updateSessionTrustValidation = [
  param('id').isMongoId().withMessage('Valid session id is required'),
  body('trusted').isBoolean().withMessage('trusted must be a boolean'),
];
