import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { getDbStatus } from './config/db.js';
import { configurePassport } from './config/passport.js';
import apiRoutes from './routes/apiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import socialAuthRoutes from './routes/socialAuthRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import resumeBuilderRoutes from './routes/resumeBuilderRoutes.js';
import skillQuizRoutes from './routes/skillQuizRoutes.js';
import mockInterviewRoutes from './routes/mockInterviewRoutes.js';
import voiceAnalysisRoutes from './routes/voiceAnalysisRoutes.js';
import videoAnalysisRoutes from './routes/videoAnalysisRoutes.js';
import resumeScannerRoutes from './routes/resumeScannerRoutes.js';
import { ERROR_CODES, getErrorMessage } from './constants/apiErrorCodes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

configurePassport();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

const createCodedRateLimiter = ({ windowMs, max, code, skip }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
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

const authLimiter = createCodedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  code: ERROR_CODES.RATE_LIMIT.AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (['/social/exchange', '/social/status'].includes(req.path)) {
      return true;
    }

    if (req.method !== 'GET') return false;
    if (['/google', '/facebook', '/linkedin'].includes(req.path)) return true;
    if (
      [
        '/google/callback',
        '/facebook/callback',
        '/linkedin/callback',
        '/social/callback',
        '/social/google',
        '/social/facebook',
        '/social/linkedin',
        '/social/google/callback',
        '/social/facebook/callback',
        '/social/linkedin/callback',
      ].includes(req.path)
    ) {
      return true;
    }
    return false;
  },
});

const socialOAuthLimiter = createCodedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  code: ERROR_CODES.RATE_LIMIT.SOCIAL_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method !== 'GET') return false;
    if (req.path === '/status') return true;
    if (['/google', '/facebook', '/linkedin'].includes(req.path)) return true;
    if (['/google/callback', '/facebook/callback', '/linkedin/callback'].includes(req.path)) {
      return true;
    }
    if (req.path === '/social/callback') return true;
    if (
      [
        '/social/google',
        '/social/facebook',
        '/social/linkedin',
        '/social/google/callback',
        '/social/facebook/callback',
        '/social/linkedin/callback',
      ].includes(req.path)
    ) {
      return true;
    }
    return false;
  },
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to AI CareerBridge API' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: getDbStatus(),
  });
});

app.use('/api', apiRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', userRoutes);
app.use('/api', resumeBuilderRoutes);
app.use('/api', skillQuizRoutes);
app.use('/api', mockInterviewRoutes);
app.use('/api', voiceAnalysisRoutes);
app.use('/api', videoAnalysisRoutes);
app.use('/api', resumeScannerRoutes);
app.use('/api', verifyRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', socialOAuthLimiter, socialAuthRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
