/**
 * Transcript-based linguistic metrics. Reuses voiceAnalysisMetrics word/filler helpers.
 */

import {
  VOCAB_TTR_HARD,
  VOCAB_TTR_SOFT,
  WHISPER_LOGPROB_PRONUNCIATION_CEIL,
  WHISPER_LOGPROB_PRONUNCIATION_FLOOR,
  WPM_IDEAL_MAX,
  WPM_IDEAL_MIN,
} from '../../config/speechMonitoringConfig.js';
import {
  computeWpm,
  countFillerWords,
  countWords,
} from '../../utils/voiceAnalysisMetrics.js';

const clamp100 = (n) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));

const tokenizeWords = (transcript = '') => {
  const trimmed = String(transcript || '').trim().toLowerCase();
  if (!trimmed) return [];
  return trimmed
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

/**
 * Type-token ratio and average word length → vocabularyQuality 0–100 (deterministic).
 */
export const computeVocabularyFeatures = (transcript = '') => {
  const tokens = tokenizeWords(transcript);
  const wordCount = tokens.length;
  if (!wordCount) {
    return {
      wordCount: 0,
      uniqueWordCount: 0,
      typeTokenRatio: null,
      averageWordLength: null,
      vocabularyQuality: null,
    };
  }

  const unique = new Set(tokens);
  const typeTokenRatio = Number((unique.size / wordCount).toFixed(3));
  const averageWordLength = Number(
    (tokens.reduce((s, w) => s + w.length, 0) / wordCount).toFixed(2)
  );

  let vocabularyQuality;
  if (typeTokenRatio <= VOCAB_TTR_SOFT) vocabularyQuality = clamp100(35 * (typeTokenRatio / VOCAB_TTR_SOFT));
  else if (typeTokenRatio >= VOCAB_TTR_HARD) vocabularyQuality = 100;
  else {
    const t = (typeTokenRatio - VOCAB_TTR_SOFT) / (VOCAB_TTR_HARD - VOCAB_TTR_SOFT);
    vocabularyQuality = clamp100(35 + t * 65);
  }

  // Slight boost for reasonable average word length (interview lexicon), never invent when empty.
  if (averageWordLength >= 4.2 && averageWordLength <= 7.5) {
    vocabularyQuality = clamp100(vocabularyQuality + 5);
  }

  return {
    wordCount,
    uniqueWordCount: unique.size,
    typeTokenRatio,
    averageWordLength,
    vocabularyQuality,
  };
};

/**
 * Pronunciation from Whisper segment avg_logprob only — null without segments.
 * @param {Array<{ avg_logprob?: number, avgLogprob?: number }>} segments
 */
export const computePronunciationScore = (segments) => {
  if (!Array.isArray(segments) || !segments.length) return null;

  const probs = segments
    .map((s) => Number(s.avg_logprob ?? s.avgLogprob))
    .filter((n) => Number.isFinite(n));

  if (!probs.length) return null;

  const avg = probs.reduce((a, b) => a + b, 0) / probs.length;
  const floor = WHISPER_LOGPROB_PRONUNCIATION_FLOOR;
  const ceil = WHISPER_LOGPROB_PRONUNCIATION_CEIL;

  if (avg <= floor) return 0;
  if (avg >= ceil) return 100;
  return clamp100(((avg - floor) / (ceil - floor)) * 100);
};

/**
 * Speaking time (seconds) excluding silence when silenceRatio known.
 */
export const resolveSpeakingDurationSeconds = ({
  durationSeconds,
  silenceRatio,
  shortPauseDurationMs = 0,
  longPauseDurationMs = 0,
}) => {
  const total = Number(durationSeconds) || 0;
  if (total <= 0) return 0;

  const pauseMs = Number(shortPauseDurationMs) + Number(longPauseDurationMs);
  if (pauseMs > 0) {
    return Math.max(0.5, total - pauseMs / 1000);
  }

  if (Number.isFinite(Number(silenceRatio))) {
    return Math.max(0.5, total * (1 - Math.min(0.95, Number(silenceRatio))));
  }

  return total;
};

export const computeSpeedInBandScore = (wpm) => {
  const rate = Number(wpm);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  if (rate >= WPM_IDEAL_MIN && rate <= WPM_IDEAL_MAX) return 100;
  if (rate < WPM_IDEAL_MIN) {
    const t = rate / WPM_IDEAL_MIN;
    return clamp100(t * 85);
  }
  // Too fast — decay above ideal max
  const over = rate - WPM_IDEAL_MAX;
  return clamp100(100 - over * 1.5);
};

/**
 * @param {object} params
 * @param {string} params.transcript
 * @param {number} [params.durationSeconds]
 * @param {number} [params.silenceRatio]
 * @param {number} [params.shortPauseDurationMs]
 * @param {number} [params.longPauseDurationMs]
 * @param {Array} [params.segments]
 */
export const computeLinguisticMetrics = ({
  transcript = '',
  durationSeconds,
  silenceRatio,
  shortPauseDurationMs,
  longPauseDurationMs,
  segments,
} = {}) => {
  const fillerWords = countFillerWords(transcript);
  const wordCount = countWords(transcript);
  const speakingDurationSeconds = resolveSpeakingDurationSeconds({
    durationSeconds,
    silenceRatio,
    shortPauseDurationMs,
    longPauseDurationMs,
  });

  const speechSpeedWpm =
    wordCount && speakingDurationSeconds > 0
      ? computeWpm(transcript, speakingDurationSeconds)
      : 0;

  const wallClockWpm =
    wordCount && Number(durationSeconds) > 0 ? computeWpm(transcript, durationSeconds) : 0;

  const vocab = computeVocabularyFeatures(transcript);
  const pronunciationScore = computePronunciationScore(segments);
  const speedInBandScore = computeSpeedInBandScore(speechSpeedWpm || wallClockWpm);

  const fillersPer100Words =
    wordCount > 0 ? Number(((fillerWords / wordCount) * 100).toFixed(2)) : 0;

  return {
    speechSpeedWpm: speechSpeedWpm || wallClockWpm,
    wallClockWpm,
    speakingDurationSeconds: Number(speakingDurationSeconds.toFixed(2)),
    wordCount,
    fillerWords,
    fillersPer100Words,
    speedInBandScore,
    pronunciationScore,
    ...vocab,
  };
};
