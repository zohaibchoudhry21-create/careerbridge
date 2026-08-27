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

/** Primary + optional fallback API keys (deduped, order preserved). */
export const getGroqApiKeys = () => {
  const keys = [];
  for (const raw of [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_FALLBACK]) {
    const key = String(raw || '').trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
};

export const getGroqConfig = () => {
  const apiKeys = getGroqApiKeys();
  return {
    apiKey: apiKeys[0] || '',
    apiKeys,
    model: resolveGroqModelId(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL),
    fastModel: resolveGroqModelId(process.env.GROQ_FAST_MODEL, DEFAULT_GROQ_FAST_MODEL),
    whisperModel: process.env.GROQ_WHISPER_MODEL?.trim() || DEFAULT_GROQ_WHISPER_MODEL,
  };
};

export const isGroqConfigured = () => getGroqApiKeys().length > 0;

/** True when another Groq org/key may still have quota (429 / TPD / TPM). */
export const isGroqRateLimitError = (error) => {
  const status = Number(error?.status || error?.statusCode || 0);
  const code = String(error?.error?.code || error?.code || '');
  const message = String(error?.message || '');
  return (
    status === 429 ||
    code === 'rate_limit_exceeded' ||
    /rate limit|tokens per day|TPD|tokens per minute|TPM/i.test(message)
  );
};
