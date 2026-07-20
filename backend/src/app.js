import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import { configurePassport } from './config/passport.js';
import apiRoutes from './routes/apiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import socialAuthRoutes from './routes/socialAuthRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import resumeBuilderRoutes from './routes/resumeBuilderRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

connectDB();
configurePassport();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
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

const socialOAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many social login attempts. Please try again later.' },
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

const sensitiveAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many account security attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to AI CareerBridge API' });
});

app.use('/api', apiRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', sensitiveAccountLimiter, userRoutes);
app.use('/api', resumeBuilderRoutes);
app.use('/api', verifyRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', socialOAuthLimiter, socialAuthRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
