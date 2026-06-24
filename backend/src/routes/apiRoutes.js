import express from 'express';
import { getDbStatus } from '../config/db.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  const db = getDbStatus();

  res.json({
    success: true,
    message: 'AI CareerBridge API is running',
    timestamp: new Date().toISOString(),
    database: db,
  });
});

export default router;
