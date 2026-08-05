import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { MAX_VOICE_AUDIO_DURATION_MS } from '../constants/interviewPrepConstants.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { withGroqRetry } from './withGroqRetry.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

/**
 * Reject oversized audio before spending a Whisper call.
 * @param {number|undefined} durationMs
 * @param {number|undefined} durationSeconds
 */
export const assertAudioDurationWithinCap = (durationMs, durationSeconds) => {
  let ms = Number(durationMs);
  if (!Number.isFinite(ms) && Number.isFinite(Number(durationSeconds))) {
    ms = Number(durationSeconds) * 1000;
  }
  if (!Number.isFinite(ms)) return;
  if (ms > MAX_VOICE_AUDIO_DURATION_MS) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AUDIO_TOO_LONG, 400, {
      maxMinutes: Math.round(MAX_VOICE_AUDIO_DURATION_MS / 60000),
    });
  }
};

/**
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {string} mimeType
 * @param {{ durationMs?: number, durationSeconds?: number }} [limits]
 */
export const transcribeAudioWithGroq = async (
  buffer,
  filename = 'answer.webm',
  mimeType = 'audio/webm',
  { durationMs, durationSeconds } = {}
) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  if (!buffer?.length) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AUDIO_EMPTY, 400);
  }

  // Reject before paid Whisper call when client reports duration.
  assertAudioDurationWithinCap(durationMs, durationSeconds);

  const { whisperModel } = getGroqConfig();
  const client = getClient();

  const file = new File([buffer], filename, { type: mimeType });

  let transcription;
  try {
    transcription = await withGroqRetry(
      () =>
        client.audio.transcriptions.create({
          file,
          model: whisperModel,
          response_format: 'verbose_json',
          temperature: 0,
        }),
      { label: 'groq-whisper' }
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AI_SERVICE_UNAVAILABLE, 503);
  }

  const text = typeof transcription === 'string' ? transcription : transcription.text?.trim() || '';

  if (!text) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPTION_FAILED, 422);
  }

  const reportedDuration =
    typeof transcription === 'object' ? Number(transcription.duration) : undefined;
  if (Number.isFinite(reportedDuration)) {
    assertAudioDurationWithinCap(undefined, reportedDuration);
  }

  return {
    text,
    duration: reportedDuration,
    segments: typeof transcription === 'object' ? transcription.segments : undefined,
  };
};
