import { validationResult } from 'express-validator';
import { AppError } from '../utils/sendResponse.js';

export const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }

  next();
};

export default validateRequest;
