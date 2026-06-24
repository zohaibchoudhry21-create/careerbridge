export const sendResponse = (res, statusCode, success, message, data = {}) => {
  res.status(statusCode).json({
    success,
    message,
    ...data,
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
