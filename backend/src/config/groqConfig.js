const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export const getGroqConfig = () => ({
  apiKey: process.env.GROQ_API_KEY || '',
  model: process.env.GROQ_MODEL || DEFAULT_MODEL,
});

export const isGroqConfigured = () => Boolean(process.env.GROQ_API_KEY?.trim());
