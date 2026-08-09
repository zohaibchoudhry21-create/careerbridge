/**
 * Shape live audio hints for submit: smaller payload, same metric fields.
 */

import {
  SUBMIT_ACOUSTIC_SAMPLES_MAX,
  SUBMIT_ACOUSTIC_SAMPLE_STRIDE,
  SUBMIT_PAUSE_EVENTS_MAX,
} from '../config/interviewPerfConfig.js';

/**
 * @param {object} hints
 * @returns {object}
 */
export function prepareLiveAudioHintsForSubmit(hints = {}) {
  if (!hints || typeof hints !== 'object') return {};

  const {
    inLongPause: _inLongPause,
    acousticSamples,
    pauseEvents,
    averageVolume,
    silenceRatio,
    longPauseCount,
    sampleIntervalMs,
    ...rest
  } = hints;

  const samples = Array.isArray(acousticSamples) ? acousticSamples : [];
  const stride = SUBMIT_ACOUSTIC_SAMPLE_STRIDE;
  const downsampled =
    stride <= 1 ? samples : samples.filter((_, index) => index % stride === 0);

  return {
    ...rest,
    averageVolume,
    silenceRatio,
    longPauseCount,
    sampleIntervalMs: sampleIntervalMs != null ? sampleIntervalMs * stride : sampleIntervalMs,
    acousticSamples: downsampled.slice(-SUBMIT_ACOUSTIC_SAMPLES_MAX),
    pauseEvents: Array.isArray(pauseEvents)
      ? pauseEvents.slice(-SUBMIT_PAUSE_EVENTS_MAX)
      : undefined,
  };
}
