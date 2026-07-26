const FILLER_PATTERN =
  /\b(um|uh|uhm|umm|like|actually|basically|you know|i mean|sort of|kind of)\b/gi;

export const countFillerWords = (transcript = '') => {
  const matches = transcript.match(FILLER_PATTERN);
  return matches ? matches.length : 0;
};

export const countWords = (transcript = '') => {
  const trimmed = transcript.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

/**
 * @param {string} transcript
 * @param {number} durationSeconds total spoken window (from Whisper or recording)
 */
export const computeWpm = (transcript, durationSeconds) => {
  const words = countWords(transcript);
  if (!words || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  return Math.round(words / (durationSeconds / 60));
};

/**
 * @param {Array<{ start?: number, end?: number }>} segments
 * @param {number} totalDurationSeconds
 */
export const computePauseRatio = (segments, totalDurationSeconds) => {
  if (!totalDurationSeconds || totalDurationSeconds <= 0) {
    return 0;
  }

  if (!Array.isArray(segments) || segments.length === 0) {
    return 0;
  }

  let speechSeconds = 0;

  for (const segment of segments) {
    const start = Number(segment.start);
    const end = Number(segment.end);

    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      speechSeconds += end - start;
    }
  }

  const pauseSeconds = Math.max(0, totalDurationSeconds - speechSeconds);
  return Math.min(1, Number((pauseSeconds / totalDurationSeconds).toFixed(3)));
};

/**
 * @param {object} params
 * @param {string} params.transcript
 * @param {number} [params.duration] Whisper duration (seconds)
 * @param {Array} [params.segments]
 * @param {number} [params.durationMs] client recording duration
 */
export const computeLocalVoiceMetrics = ({
  transcript,
  duration,
  segments,
  durationMs,
}) => {
  const durationSeconds =
    Number(duration) > 0
      ? Number(duration)
      : durationMs
        ? Number(durationMs) / 1000
        : 0;

  const wpm = computeWpm(transcript, durationSeconds);
  const fillerWords = countFillerWords(transcript);
  const pauseRatio = computePauseRatio(segments, durationSeconds);

  return {
    wpm,
    fillerWords,
    pauseRatio,
    durationSeconds,
  };
};
