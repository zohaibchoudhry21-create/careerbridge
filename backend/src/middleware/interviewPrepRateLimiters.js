import rateLimit from 'express-rate-limit';
import { getInterviewPrepRateLimitKey } from '../utils/interviewPrepRateLimitKey.js';

/**
 * Per-authenticated-user keys (falls back to IP if protect did not run).
 * Matches resume builder pattern: express-rate-limit + standardHeaders.
 */
const userKeyGenerator = getInterviewPrepRateLimitKey;

const createUserRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: userKeyGenerator,
    handler: (req, res, _next, _options) => {
      const resetTime = req.rateLimit?.resetTime;
      let retryAfterSeconds = Math.max(1, Math.ceil(windowMs / 1000));

      if (resetTime instanceof Date) {
        retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
      }

      res.set('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    },
  });

/** start, next-question, submit-answer (Groq + Whisper per minute cap) */
export const interviewFlowLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'Too many interview requests. Please wait a moment and try again.',
});

/** report generation (heavier Groq aggregation) */
export const interviewHeavyLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many interview report requests. Please wait before generating again.',
});

/** skill quiz AI generation */
export const skillQuizGenerateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many quiz generation requests. Please wait before trying again.',
});

/** skill quiz submit (server scoring; abuse protection) */
export const skillQuizSubmitLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many quiz submit attempts. Please wait and try again.',
});
