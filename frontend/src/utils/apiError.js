import i18n from '../i18n';

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9]*(?:\.[A-Z][A-Z0-9_]*)+$/;

/**
 * @param {string} code
 */
export function isApiErrorCode(code) {
  return typeof code === 'string' && ERROR_CODE_PATTERN.test(code);
}

/**
 * @param {(key: string, options?: object) => string} t
 * @param {string} code
 * @param {Record<string, string | number>} [params]
 */
function translateErrorCode(t, code, params = {}) {
  if (code === 'PASSWORD.POLICY_VIOLATION' && params.rule) {
    const ruleText = t(`validation.rules.${params.rule}`, {
      ns: 'auth',
      defaultValue: '',
    });
    if (ruleText) {
      return ruleText;
    }
  }

  const [domain, ...rest] = code.split('.');
  const key = rest.join('.');

  const translated = t(`${domain}.${key}`, {
    ns: 'errors',
    ...params,
    defaultValue: '',
  });

  if (translated && translated !== `${domain}.${key}` && translated !== code) {
    return translated;
  }

  return '';
}

/**
 * @param {{ code?: string, params?: Record<string, string | number>, message?: string, retryAfterSeconds?: number } | undefined} data
 * @param {(key: string, options?: object) => string} [t]
 * @param {string} [fallback]
 */
export function resolveApiErrorPayload(data, t, fallback = '') {
  const translate = t || i18n.t.bind(i18n);
  const code = data?.code;
  const params = data?.params || {};

  if (code && isApiErrorCode(code)) {
    const translated = translateErrorCode(translate, code, params);
    if (translated) {
      if (data?.retryAfterSeconds) {
        const retrySuffix = translate('RATE_LIMIT.RETRY_AFTER', {
          ns: 'errors',
          seconds: data.retryAfterSeconds,
          defaultValue: ` Try again in about ${data.retryAfterSeconds} seconds.`,
        });
        return `${translated}${retrySuffix}`;
      }
      return translated;
    }
  }

  if (data?.message) {
    if (data.retryAfterSeconds) {
      const retrySuffix = translate('RATE_LIMIT.RETRY_AFTER', {
        ns: 'errors',
        seconds: data.retryAfterSeconds,
        defaultValue: ` Try again in about ${data.retryAfterSeconds} seconds.`,
      });
      return `${data.message}${retrySuffix}`;
    }
    return data.message;
  }

  if (fallback) {
    return fallback;
  }

  return translate('COMMON.UNKNOWN', {
    ns: 'errors',
    defaultValue: 'Something went wrong. Please try again.',
  });
}

/**
 * @param {import('axios').AxiosError | Error} error
 * @param {string} [fallback]
 */
export function resolveApiError(error, fallback = '') {
  return resolveApiErrorPayload(error?.response?.data, null, fallback);
}

/**
 * @param {string} code
 * @param {Record<string, string | number>} [params]
 * @param {string} [fallback]
 */
export function resolveApiErrorCode(code, params = {}, fallback = '') {
  return resolveApiErrorPayload({ code, params }, null, fallback);
}

/**
 * @param {import('axios').AxiosError | Error} error
 * @param {string} fallback
 * @deprecated Use resolveApiError — kept for existing imports
 */
export function getApiErrorMessage(error, fallback) {
  return resolveApiError(error, fallback);
}
