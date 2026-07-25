import { AppError } from '../utils/sendResponse.js';

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    console.error(err);
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please use another email or log in.',
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // A malformed :id in the URL would otherwise surface as a bare 500.
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path || 'identifier'}.`,
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large. Upload a document under 10 MB.'
          : 'File upload failed. Please check the file and try again.',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload is too large.',
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export const notFound = (_req, _res, next) => {
  next(new AppError('Route not found', 404));
};
