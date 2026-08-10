import { getDbStatus } from '../config/db.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, buildErrorPayload } from '../utils/sendResponse.js';

export const requireDb = (req, res, next) => {
  const { connected } = getDbStatus();
  if (connected) {
    return next();
  }

  const error = new AppError(ERROR_CODES.COMMON.DATABASE_UNAVAILABLE, 503);
  const { statusCode, body } = buildErrorPayload(error);
  return res.status(statusCode).json(body);
};

export default requireDb;
