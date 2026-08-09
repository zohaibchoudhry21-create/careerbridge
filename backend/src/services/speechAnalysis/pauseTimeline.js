/**
 * Thinking time + throttled speech timeline events.
 */

import {
  LONG_PAUSE_MIN_MS,
  SPEECH_TIMELINE_EVENTS_MAX,
  SPEECH_TIMELINE_EVENT_MIN_HOLD_MS,
  SPEECH_TIMELINE_EVENT_THROTTLE_MS,
  THINKING_TIME_MAX_TRACK_MS,
  THINKING_TIME_MIN_MS,
  WPM_TOO_FAST,
  WPM_TOO_SLOW,
} from '../../config/speechMonitoringConfig.js';
import { formatOffsetLabel } from '../../utils/behavioralAnalysisUtils.js';

/**
 * Estimate thinking time (ms) from assistant→user gaps when turns lack timestamps.
 * Uses equal time-slice heuristic across turns when only durationMs is known.
 * Prefer acoustic long pauses after AI turns when pauseEvents exist.
 *
 * @param {Array<{ role?: string, content?: string }>} turns
 * @param {{ durationMs?: number, pauseEvents?: Array<{ tMs?: number, durationMs?: number, type?: string }> }} [options]
 */
export const computeThinkingTimeMetrics = (turns = [], options = {}) => {
  const durationMs = Number(options.durationMs) || 0;
  const pauseEvents = Array.isArray(options.pauseEvents) ? options.pauseEvents : [];
  const normalized = (turns || []).filter((t) => t && (t.role === 'user' || t.role === 'assistant'));

  /** @type {number[]} */
  const thinkingSamplesMs = [];

  if (normalized.length >= 2 && durationMs > 0) {
    const slice = durationMs / normalized.length;
    for (let i = 0; i < normalized.length - 1; i += 1) {
      const cur = normalized[i];
      const next = normalized[i + 1];
      if (cur.role === 'assistant' && next.role === 'user') {
        // Approximate thinking as a portion of the slice before user speech; clamp.
        const estimate = Math.min(THINKING_TIME_MAX_TRACK_MS, Math.max(0, slice * 0.25));
        if (estimate >= THINKING_TIME_MIN_MS) thinkingSamplesMs.push(Math.round(estimate));
      }
    }
  }

  // Prefer measured long pauses overlapping post-assistant windows when available.
  const longFromAcoustic = pauseEvents
    .filter((e) => e.type === 'long' || Number(e.durationMs) >= LONG_PAUSE_MIN_MS)
    .map((e) => Number(e.durationMs))
    .filter((n) => Number.isFinite(n) && n >= THINKING_TIME_MIN_MS);

  const source = longFromAcoustic.length ? longFromAcoustic : thinkingSamplesMs;
  const totalThinkingMs = source.reduce((a, b) => a + b, 0);
  const averageThinkingMs = source.length
    ? Math.round(totalThinkingMs / source.length)
    : 0;

  return {
    thinkingTimeTotalMs: totalThinkingMs,
    thinkingTimeAverageMs: averageThinkingMs,
    thinkingEpisodeCount: source.length,
    thinkingTimeSource: longFromAcoustic.length ? 'acoustic_long_pauses' : 'turn_heuristic',
  };
};

/**
 * @typedef {Object} SpeechTimelineEvent
 * @property {number} tMs
 * @property {string} offsetLabel
 * @property {string} type
 * @property {string} message
 * @property {'info'|'warning'|'critical'} [severity]
 */

/**
 * Build time-based speech analytics events from pauses + rate signals.
 * @param {object} params
 */
export const buildSpeechTimelineEvents = ({
  pauseEvents = [],
  speechSpeedWpm,
  fillersPer100Words,
  energyCv,
  durationMs = 0,
} = {}) => {
  /** @type {SpeechTimelineEvent[]} */
  const events = [];
  /** @type {Record<string, number>} */
  const lastEmittedAt = {};

  const tryEmit = (type, tMs, message, severity = 'info') => {
    const last = lastEmittedAt[type];
    if (Number.isFinite(last) && tMs - last < SPEECH_TIMELINE_EVENT_THROTTLE_MS) return;
    lastEmittedAt[type] = tMs;
    events.push({
      tMs,
      offsetLabel: formatOffsetLabel(tMs),
      type,
      message,
      severity,
    });
  };

  let longHoldMs = 0;
  let longHoldStart = null;

  for (const pause of pauseEvents) {
    const tMs = Number(pause.tMs) || 0;
    const duration = Number(pause.durationMs) || 0;
    const type = pause.type || (duration >= LONG_PAUSE_MIN_MS ? 'long' : 'short');

    if (type === 'short') {
      tryEmit('short_pause', tMs, 'Short pause detected', 'info');
    }

    if (type === 'long') {
      if (longHoldStart == null) longHoldStart = tMs;
      longHoldMs += duration;
      if (longHoldMs >= SPEECH_TIMELINE_EVENT_MIN_HOLD_MS) {
        tryEmit('long_pause', longHoldStart ?? tMs, 'Long pause detected', 'warning');
        longHoldMs = 0;
        longHoldStart = null;
      }
    } else {
      longHoldMs = 0;
      longHoldStart = null;
    }
  }

  const mid = Math.max(0, Math.floor(Number(durationMs) / 2));

  if (Number(speechSpeedWpm) >= WPM_TOO_FAST) {
    tryEmit('speaking_too_fast', mid, 'Speaking pace is quite fast', 'warning');
  } else if (Number(speechSpeedWpm) > 0 && Number(speechSpeedWpm) <= WPM_TOO_SLOW) {
    tryEmit('speaking_too_slow', mid, 'Speaking pace is quite slow', 'info');
  }

  if (Number(fillersPer100Words) >= 8) {
    tryEmit('filler_cluster', mid, 'Elevated filler-word usage', 'warning');
  }

  if (Number(energyCv) >= 0.7) {
    tryEmit('energy_unstable', mid, 'Voice energy is highly variable', 'info');
  }

  if (Number(speechSpeedWpm) > 0 && Number(speechSpeedWpm) < WPM_TOO_FAST && Number(fillersPer100Words) < 3) {
    tryEmit('steady_delivery', Math.min(15000, mid || 15000), 'Steady speaking delivery', 'info');
  }

  return events.slice(0, SPEECH_TIMELINE_EVENTS_MAX);
};
