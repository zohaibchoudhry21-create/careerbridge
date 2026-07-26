import rateLimit from 'express-rate-limit';
import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';
import { getInterviewPrepRateLimitKey } from '../utils/interviewPrepRateLimitKey.js';

/**
 * Per-authenticated-user keys (falls back to IP if protect did not run).
 * Matches resume builder pattern: express-rate-limit + standardHeaders.
 */
const userKeyGenerator = getInterviewPrepRateLimitKey;

const createUserRateLimiter = ({ windowMs, max, code }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: userKeyGenerator,
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      let retryAfterSeconds = Math.max(1, Math.ceil(windowMs / 1000));

      if (resetTime instanceof Date) {
        retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
      }

      res.set('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        code,
        params: {},
        message: getErrorMessage(code),
        retryAfterSeconds,
      });
    },
  });

/** start, next-question, submit-answer (Groq + Whisper per minute cap) */
export const interviewFlowLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  code: ERROR_CODES.RATE_LIMIT.INTERVIEW_FLOW,
});

/** report generation (heavier Groq aggregation) */
export const interviewHeavyLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  code: ERROR_CODES.RATE_LIMIT.INTERVIEW_HEAVY,
});

/** skill quiz AI generation */
export const skillQuizGenerateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  code: ERROR_CODES.RATE_LIMIT.SKILL_QUIZ_GENERATE,
});

/** skill quiz submit (server scoring; abuse protection) */
export const skillQuizSubmitLimiter = createUserRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  code: ERROR_CODES.RATE_LIMIT.SKILL_QUIZ_SUBMIT,
});
