import rateLimit from 'express-rate-limit';
import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';

export const getResumeScannerRateLimitKey = (req) => {
  if (req.user?._id) {
    return `user:${req.user._id}`;
  }
  return `ip:${req.ip}`;
};

export const resumeScannerHeavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getResumeScannerRateLimitKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    let retryAfterSeconds = Math.max(1, Math.ceil((15 * 60 * 1000) / 1000));

    if (resetTime instanceof Date) {
      retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    }

    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: ERROR_CODES.RATE_LIMIT.RESUME_SCANNER,
      params: {},
      message: getErrorMessage(ERROR_CODES.RATE_LIMIT.RESUME_SCANNER),
      retryAfterSeconds,
    });
  },
});

export const resumeScannerTextLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getResumeScannerRateLimitKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    let retryAfterSeconds = 60;

    if (resetTime instanceof Date) {
      retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    }

    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: ERROR_CODES.RATE_LIMIT.RESUME_SCANNER,
      params: {},
      message: getErrorMessage(ERROR_CODES.RATE_LIMIT.RESUME_SCANNER),
      retryAfterSeconds,
    });
  },
});
