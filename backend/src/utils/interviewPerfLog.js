/**
 * Lightweight structured logging for interview pipeline stages.
 */

import { INTERVIEW_PERF_LOG_ENABLED } from '../config/interviewPerfConfig.js';

/**
 * @param {string} stage
 * @param {object} [fields]
 */
export const logInterviewStage = (stage, fields = {}) => {
  if (!INTERVIEW_PERF_LOG_ENABLED) return;
  const payload = {
    ts: new Date().toISOString(),
    scope: 'interview',
    stage,
    ...fields,
  };
  // Single-line JSON for log aggregators.
  console.info(`[interview-perf] ${JSON.stringify(payload)}`);
};

/**
 * @template T
 * @param {string} stage
 * @param {() => Promise<T>} fn
 * @param {object} [fields]
 * @returns {Promise<T>}
 */
export const withInterviewStageTiming = async (stage, fn, fields = {}) => {
  const started = Date.now();
  try {
    const result = await fn();
    logInterviewStage(stage, { ...fields, ok: true, durationMs: Date.now() - started });
    return result;
  } catch (error) {
    logInterviewStage(stage, {
      ...fields,
      ok: false,
      durationMs: Date.now() - started,
      error: error?.message || String(error),
      code: error?.code,
    });
    throw error;
  }
};
