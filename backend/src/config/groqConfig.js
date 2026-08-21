/**
 * Groq chat / Whisper model IDs.
 *
 * Groq retired `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` on 2026-08-16
 * (free / developer tier). https://console.groq.com/docs/deprecations
 */

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_GROQ_FAST_MODEL = 'openai/gpt-oss-20b';
export const DEFAULT_GROQ_WHISPER_MODEL = 'whisper-large-v3';

/** Retired Groq model IDs → current replacements so leftover .env values still work. */
export const RETIRED_GROQ_MODEL_IDS = Object.freeze({
  'llama-3.1-8b-instant': DEFAULT_GROQ_FAST_MODEL,
  'llama-3.3-70b-versatile': DEFAULT_GROQ_MODEL,
  'llama-3.1-70b-versatile': DEFAULT_GROQ_MODEL,
  'llama3-8b-8192': DEFAULT_GROQ_FAST_MODEL,
  'llama3-70b-8192': DEFAULT_GROQ_MODEL,
});

const remapWarned = new Set();

export const resolveGroqModelId = (modelId, fallback) => {
  const raw = String(modelId || '').trim();
  const resolved = raw ? raw : fallback;
  const mapped = RETIRED_GROQ_MODEL_IDS[resolved] || resolved;

  if (mapped !== resolved && !remapWarned.has(resolved)) {
    remapWarned.add(resolved);
    console.warn(`[groq] Model "${resolved}" was retired; using "${mapped}"`);
  }

  return mapped;
};

export const getGroqConfig = () => ({
  apiKey: process.env.GROQ_API_KEY || '',
  model: resolveGroqModelId(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL),
  fastModel: resolveGroqModelId(process.env.GROQ_FAST_MODEL, DEFAULT_GROQ_FAST_MODEL),
  whisperModel: process.env.GROQ_WHISPER_MODEL?.trim() || DEFAULT_GROQ_WHISPER_MODEL,
});

export const isGroqConfigured = () => Boolean(process.env.GROQ_API_KEY?.trim());
