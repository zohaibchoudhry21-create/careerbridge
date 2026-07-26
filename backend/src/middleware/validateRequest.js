import { validationResult } from 'express-validator';
import { parseValidationCode } from '../constants/apiErrorCodes.js';
import { AppError } from '../utils/sendResponse.js';

const buildValidationAppError = (first) => {
  const parsed = parseValidationCode(first.msg);

  if (parsed) {
    const params = { ...parsed.params };
    if (first.path && !params.field) {
      params.field = first.path;
    }
    return new AppError(parsed.code, 400, params);
  }

  return new AppError(first.msg, 400);
};

export const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(buildValidationAppError(errors.array()[0]));
  }

  next();
};

export default validateRequest;
