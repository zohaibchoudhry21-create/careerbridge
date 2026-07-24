/**
 * @param {import('axios').AxiosError | Error} error
 * @param {string} fallback
 */
export function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const message = data?.message || error?.message || fallback;

  if (error?.response?.status === 429 && data?.retryAfterSeconds) {
    return `${message} Try again in about ${data.retryAfterSeconds} seconds.`;
  }

  return message;
}
