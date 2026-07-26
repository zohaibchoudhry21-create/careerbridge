import { ERROR_MESSAGES, getErrorMessage, isErrorCode } from '../constants/apiErrorCodes.js';

export const sendResponse = (res, statusCode, success, message, data = {}) => {
  res.status(statusCode).json({
    success,
    message,
    ...data,
  });
};

export class AppError extends Error {
  /**
   * @param {string} codeOrMessage - Error code (e.g. AUTH.INVALID_CREDENTIALS) or legacy English message
   * @param {number} [statusCode=500]
   * @param {Record<string, string | number>} [params={}]
   */
  constructor(codeOrMessage, statusCode = 500, params = {}) {
    const hasCode = isErrorCode(codeOrMessage);
    const message = hasCode
      ? getErrorMessage(codeOrMessage, params)
      : codeOrMessage;

    super(message);
    this.code = hasCode ? codeOrMessage : undefined;
    this.statusCode = statusCode;
    this.params = params;
    this.isOperational = true;
  }
}

export const buildErrorPayload = (err) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (err.code && isErrorCode(err.code)) {
    return {
      statusCode,
      body: {
        success: false,
        code: err.code,
        params: err.params || {},
        message: err.message || ERROR_MESSAGES[err.code] || err.code,
      },
    };
  }

  if (isOperational && err.message) {
    return {
      statusCode,
      body: {
        success: false,
        message: err.message,
      },
    };
  }

  return {
    statusCode,
    body: {
      success: false,
      code: 'COMMON.INTERNAL_ERROR',
      params: {},
      message: getErrorMessage('COMMON.INTERNAL_ERROR'),
    },
  };
};
