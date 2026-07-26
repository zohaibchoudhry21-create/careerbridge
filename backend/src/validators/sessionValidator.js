import { body, param } from 'express-validator';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';

export const updateSessionTrustValidation = [
  param('id').isMongoId().withMessage(ERROR_CODES.VALIDATION.SESSION_ID_INVALID),
  body('trusted').isBoolean().withMessage(ERROR_CODES.VALIDATION.TRUSTED_BOOLEAN),
];
