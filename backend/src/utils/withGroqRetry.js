/**
 * Retry wrapper for transient Groq / network failures.
 * Does not retry typical 4xx client errors (except 429).
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getStatus = (err) =>
  Number(err?.status || err?.statusCode || err?.response?.status || err?.error?.status) || 0;

export const isRetryableGroqError = (err) => {
  if (!err) return false;
  const status = getStatus(err);
  if (status === 429 || status >= 500) return true;
  const code = String(err.code || err.cause?.code || '');
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) {
    return true;
  }
  const message = String(err.message || '').toLowerCase();
  return message.includes('timeout') || message.includes('rate limit') || message.includes('temporarily');
};

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, baseDelayMs?: number, label?: string }} [options]
 * @returns {Promise<T>}
 */
export const withGroqRetry = async (fn, { retries = 2, baseDelayMs = 400, label = 'groq' } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable = isRetryableGroqError(err);
      if (!retryable || attempt === retries) {
        if (attempt > 0) {
          console.warn(`[${label}] Giving up after ${attempt + 1} attempt(s):`, err.message);
        }
        break;
      }
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 100;
      console.warn(
        `[${label}] Transient failure (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay)}ms:`,
        err.message
      );
      await sleep(delay);
    }
  }
  throw lastError;
};
