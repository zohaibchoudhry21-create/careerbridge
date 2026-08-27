const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

export const getGeminiConfig = () => ({
  apiKey: String(process.env.GEMINI_API_KEY || '').trim(),
  model: String(process.env.GEMINI_MODEL || '').trim() || DEFAULT_GEMINI_MODEL,
});

export const isGeminiConfigured = () => Boolean(getGeminiConfig().apiKey);

/**
 * Prefer env model, then current flash-tier fallbacks (deduped).
 * Google retired 2.x flash IDs for new users — prefer 3.6 / 3.5-lite.
 */
export const getGeminiModelCandidates = () => {
  const { model } = getGeminiConfig();
  return [
    model,
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
  ].filter((name, index, list) => name && list.indexOf(name) === index);
};
