/**
 * Professional speech analysis orchestrator (monitoring only — no report generation).
 */

import { computeAcousticMetrics } from './acousticMetrics.js';
import { computeLinguisticMetrics } from './linguisticMetrics.js';
import { buildSpeechTimelineEvents, computeThinkingTimeMetrics } from './pauseTimeline.js';
import { composeSpeechScores } from './scoreComposer.js';
import { scoreSpeechLinguisticsWithGroq } from './speechLinguisticsGroq.js';

const normalizeHints = (liveAudioHints = {}) => {
  const hints = liveAudioHints && typeof liveAudioHints === 'object' ? liveAudioHints : {};
  return {
    averageVolume: hints.averageVolume,
    silenceRatio: hints.silenceRatio,
    longPauseCount: hints.longPauseCount,
    acousticSamples: Array.isArray(hints.acousticSamples) ? hints.acousticSamples : [],
    pauseEvents: Array.isArray(hints.pauseEvents) ? hints.pauseEvents : [],
    sampleIntervalMs: hints.sampleIntervalMs,
  };
};

/**
 * Analyze speech for monitoring. Safe to call without Groq / without acoustic samples.
 *
 * @param {object} params
 * @param {string} params.transcript
 * @param {Array<{ role?: string, content?: string }>} [params.turns]
 * @param {number} [params.durationMs]
 * @param {number} [params.duration]
 * @param {object} [params.liveAudioHints]
 * @param {Array} [params.segments] Whisper segments (enables pronunciation)
 * @param {boolean} [params.enableGroqLinguistics=true]
 */
export const analyzeSpeechMonitoring = async ({
  transcript = '',
  turns = [],
  durationMs,
  duration,
  liveAudioHints,
  segments,
  enableGroqLinguistics = true,
} = {}) => {
  const hints = normalizeHints(liveAudioHints);
  const durationSeconds =
    Number(duration) > 0
      ? Number(duration)
      : Number(durationMs) > 0
        ? Number(durationMs) / 1000
        : 0;

  const acoustic = computeAcousticMetrics({
    acousticSamples: hints.acousticSamples,
    pauseEvents: hints.pauseEvents,
    sampleIntervalMs: hints.sampleIntervalMs,
    averageVolume: hints.averageVolume,
    silenceRatio: hints.silenceRatio,
    longPauseCount: hints.longPauseCount,
  });

  const linguistic = computeLinguisticMetrics({
    transcript,
    durationSeconds,
    silenceRatio: acoustic.silenceRatio,
    shortPauseDurationMs: acoustic.shortPauseDurationMs,
    longPauseDurationMs: acoustic.longPauseDurationMs,
    segments,
  });

  const thinking = computeThinkingTimeMetrics(turns, {
    durationMs: durationMs || durationSeconds * 1000,
    pauseEvents: acoustic.pauseEvents,
  });

  let groqLinguistics = {
    grammarQuality: null,
    vocabularyQuality: null,
    emotionLabel: null,
    emotionScore: null,
  };

  if (enableGroqLinguistics && String(transcript || '').trim()) {
    groqLinguistics = await scoreSpeechLinguisticsWithGroq({ transcript });
  }

  // Prefer deterministic vocab; overlay Groq vocab only when present.
  const vocabularyQuality =
    groqLinguistics.vocabularyQuality != null
      ? groqLinguistics.vocabularyQuality
      : linguistic.vocabularyQuality;

  const grammarQuality = groqLinguistics.grammarQuality;

  const composed = composeSpeechScores({
    speedInBandScore: linguistic.speedInBandScore,
    fillersPer100Words: linguistic.fillersPer100Words,
    longPauseDurationMs: acoustic.longPauseDurationMs,
    durationMs: durationMs || durationSeconds * 1000,
    volumeStability: acoustic.volumeStability,
    pitchStability: acoustic.pitchStability,
    energyCv: acoustic.energyCv,
    pitchCv: acoustic.pitchCv,
    speechSpeedWpm: linguistic.speechSpeedWpm,
    vocabularyQuality,
    grammarQuality,
  });

  const timelineEvents = buildSpeechTimelineEvents({
    pauseEvents: acoustic.pauseEvents,
    speechSpeedWpm: linguistic.speechSpeedWpm,
    fillersPer100Words: linguistic.fillersPer100Words,
    energyCv: acoustic.energyCv,
    durationMs: durationMs || durationSeconds * 1000,
  });

  if (thinking.thinkingTimeAverageMs >= 2500) {
    timelineEvents.unshift({
      tMs: 0,
      offsetLabel: '00:00',
      type: 'thinking_time',
      message: 'Candidate used thinking time between questions',
      severity: 'info',
    });
  }

  const metrics = {
    speechSpeed: linguistic.speechSpeedWpm,
    speakingConfidence: composed.speakingConfidence,
    energy: acoustic.energy,
    pitchStability: acoustic.pitchStability,
    volumeStability: acoustic.volumeStability,
    pronunciationScore: linguistic.pronunciationScore,
    fluency: composed.fluency,
    grammarQuality,
    vocabularyQuality,
    vocabularyFeatures: {
      typeTokenRatio: linguistic.typeTokenRatio,
      averageWordLength: linguistic.averageWordLength,
      uniqueWordCount: linguistic.uniqueWordCount,
      wordCount: linguistic.wordCount,
    },
    longPauses: {
      count: acoustic.longPauseCount,
      durationMs: acoustic.longPauseDurationMs,
    },
    shortPauses: {
      count: acoustic.shortPauseCount,
      durationMs: acoustic.shortPauseDurationMs,
    },
    thinkingTime: {
      totalMs: thinking.thinkingTimeTotalMs,
      averageMs: thinking.thinkingTimeAverageMs,
      episodeCount: thinking.thinkingEpisodeCount,
      source: thinking.thinkingTimeSource,
    },
    fillerWords: linguistic.fillerWords,
    fillersPer100Words: linguistic.fillersPer100Words,
    emotion: {
      label: groqLinguistics.emotionLabel,
      score: groqLinguistics.emotionScore,
    },
    stressScore: composed.stressScore,
    speakingConsistency: composed.speakingConsistency,
    communicationScore: composed.communicationScore,
    silenceRatio: acoustic.silenceRatio,
    speakingDurationSeconds: linguistic.speakingDurationSeconds,
    // Provenance for debugging / UI honesty
    sources: {
      acousticSampleCount: acoustic.sampleCount,
      pitchedFrameCount: acoustic.pitchedFrameCount,
      pronunciation: linguistic.pronunciationScore != null ? 'whisper_logprob' : 'unavailable',
      grammar: grammarQuality != null ? 'groq' : 'unavailable',
      emotion: groqLinguistics.emotionLabel != null ? 'groq' : 'unavailable',
    },
  };

  return {
    metrics,
    timelineEvents: timelineEvents.slice(0, 80),
  };
};
