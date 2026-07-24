const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_WHISPER_MODEL = 'whisper-large-v3';

export const getGroqConfig = () => ({
  apiKey: process.env.GROQ_API_KEY || '',
  model: process.env.GROQ_MODEL || DEFAULT_MODEL,
  whisperModel: process.env.GROQ_WHISPER_MODEL || DEFAULT_WHISPER_MODEL,
});

export const isGroqConfigured = () => Boolean(process.env.GROQ_API_KEY?.trim());
