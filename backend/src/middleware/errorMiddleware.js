import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';
import { AppError, buildErrorPayload } from '../utils/sendResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    console.error(err);
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      code: ERROR_CODES.COMMON.DUPLICATE_EMAIL,
      params: {},
      message: getErrorMessage(ERROR_CODES.COMMON.DUPLICATE_EMAIL),
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      code: ERROR_CODES.VALIDATION.GENERIC,
      params: {},
      message: messages.join(', '),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: ERROR_CODES.VALIDATION.INVALID_FIELD,
      params: { field: err.path || 'identifier' },
      message: getErrorMessage(ERROR_CODES.VALIDATION.INVALID_FIELD, {
        field: err.path || 'identifier',
      }),
    });
  }

  if (err.name === 'MulterError') {
    const code =
      err.code === 'LIMIT_FILE_SIZE'
        ? ERROR_CODES.COMMON.FILE_TOO_LARGE
        : ERROR_CODES.COMMON.FILE_UPLOAD_FAILED;

    return res.status(400).json({
      success: false,
      code,
      params: {},
      message: getErrorMessage(code),
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      code: ERROR_CODES.COMMON.PAYLOAD_TOO_LARGE,
      params: {},
      message: getErrorMessage(ERROR_CODES.COMMON.PAYLOAD_TOO_LARGE),
    });
  }

  const { statusCode, body } = buildErrorPayload(err);
  res.status(statusCode).json(body);
};

export const notFound = (_req, _res, next) => {
  next(new AppError(ERROR_CODES.COMMON.ROUTE_NOT_FOUND, 404));
};
