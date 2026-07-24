import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { AppError } from './sendResponse.js';

const getClient = () => {
  const { apiKey } = getGroqConfig();

  if (!apiKey) {
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
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
    throw new AppError('Groq is not configured. Set GROQ_API_KEY in environment.', 503);
  }

  if (!buffer?.length) {
    throw new AppError('Audio recording is empty.', 400);
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
    throw new AppError('Could not transcribe your answer. Please try again.', 422);
  }

  return {
    text,
    duration: typeof transcription === 'object' ? transcription.duration : undefined,
    segments: typeof transcription === 'object' ? transcription.segments : undefined,
  };
};
