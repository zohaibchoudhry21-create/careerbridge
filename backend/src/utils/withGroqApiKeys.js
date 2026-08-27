import Groq from 'groq-sdk';
import { getGroqApiKeys, isGroqRateLimitError } from '../config/groqConfig.js';
import { withGroqRetry } from './withGroqRetry.js';

/**
 * Run a Groq SDK call, trying GROQ_API_KEY then GROQ_API_KEY_FALLBACK on rate/quota limits.
 *
 * @template T
 * @param {(client: import('groq-sdk').default, keyIndex: number) => Promise<T>} fn
 * @param {{ label?: string, timeout?: number, retries?: number }} [options]
 * @returns {Promise<T>}
 */
export const withGroqApiKeys = async (
  fn,
  { label = 'groq', timeout, retries = 2 } = {}
) => {
  const keys = getGroqApiKeys();
  if (!keys.length) {
    throw new Error('Groq API key is not configured');
  }

  let lastError;
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const client = new Groq({
      apiKey: keys[keyIndex],
      ...(timeout ? { timeout } : {}),
    });
    const keyLabel = keyIndex === 0 ? 'primary' : `fallback#${keyIndex}`;

    try {
      return await withGroqRetry(() => fn(client, keyIndex), {
        label: `${label}:${keyLabel}`,
        retries,
      });
    } catch (error) {
      lastError = error;
      const hasNext = keyIndex < keys.length - 1;
      if (hasNext && isGroqRateLimitError(error)) {
        console.warn(`[${label}] Rate/quota limit on ${keyLabel}; switching to next Groq API key`);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
};
