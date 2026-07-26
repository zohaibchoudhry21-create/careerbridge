import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  return new Groq({ apiKey });
};

/**
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {string} mimeType
 */
export const transcribeAudioWithGroq = async (buffer, filename = 'answer.webm', mimeType = 'audio/webm') => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.GROQ_NOT_CONFIGURED, 503);
  }

  if (!buffer?.length) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.AUDIO_EMPTY, 400);
  }

  const { whisperModel } = getGroqConfig();
  const client = getClient();

  const file = new File([buffer], filename, { type: mimeType });

  const transcription = await client.audio.transcriptions.create({
    file,
    model: whisperModel,
    response_format: 'verbose_json',
    temperature: 0,
  });

  const text = typeof transcription === 'string' ? transcription : transcription.text?.trim() || '';

  if (!text) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPTION_FAILED, 422);
  }

  return {
    text,
    duration: typeof transcription === 'object' ? transcription.duration : undefined,
    segments: typeof transcription === 'object' ? transcription.segments : undefined,
  };
};
