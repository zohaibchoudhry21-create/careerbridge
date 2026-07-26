import Vapi from '@vapi-ai/web';

let vapiInstance = null;

const getPublicToken = () => import.meta.env.VITE_VAPI_WEB_TOKEN?.trim() || '';

const NON_FATAL_VAPI_ERROR_TYPES = new Set([
  'audio-processing-setup-error',
  'audio-observer-setup-error',
  'audio-processor-error',
  'mic-processor-error',
]);

function collectErrorText(value, depth = 0) {
  if (value == null || depth > 4) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (value instanceof Error) {
    return value.message?.trim() || '';
  }

  if (Array.isArray(value)) {
    return value.map((item) => collectErrorText(item, depth + 1)).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    const preferredKeys = ['message', 'msg', 'details', 'error', 'description', 'reason', 'type'];
    const chunks = preferredKeys
      .map((key) => collectErrorText(value[key], depth + 1))
      .filter(Boolean);

    if (chunks.length) return chunks.join(' — ');

    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  return '';
}

/**
 * Vapi web SDK may emit plain objects like { type, msg, details }.
 * Always coerce to a user-safe string before rendering in React.
 */
export function formatVapiError(error) {
  if (!error) return 'Voice call error.';
  if (typeof error === 'string') return error;

  const text = collectErrorText(error);
  if (text) return text;

  return 'Voice call error. Check your Vapi public key and microphone access.';
}

/** Safe for any error-like value passed into JSX. */
export function toDisplayErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const vapiText = formatVapiError(error);
  if (vapiText && vapiText !== 'Voice call error.') return vapiText;

  const generic = collectErrorText(error);
  return generic || fallback;
}

/**
 * Krisp / Daily mic-processor failures are usually non-fatal — the SDK can
 * fall back to processor type "none" and the call can continue.
 */
export function isNonFatalVapiError(error) {
  if (!error || typeof error !== 'object') return false;

  if (NON_FATAL_VAPI_ERROR_TYPES.has(error.type)) {
    return true;
  }

  const signature = collectErrorText(error).toLowerCase();
  return (
    signature.includes('didiniterror') ||
    signature.includes('krisp') ||
    signature.includes('mic processor') ||
    signature.includes('audio processor') ||
    signature.includes('audio-processing') ||
    signature.includes('noise-cancellation') ||
    signature.includes('noise cancellation')
  );
}

export function getVapiClient() {
  const token = getPublicToken();

  if (!token) {
    throw new Error('VITE_VAPI_WEB_TOKEN is not configured.');
  }

  if (!vapiInstance) {
    vapiInstance = new Vapi(token);
  }

  return vapiInstance;
}

export function isVapiConfigured() {
  return Boolean(getPublicToken());
}

export function getInterviewStartTarget() {
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID?.trim();
  return assistantId || null;
}

/**
 * Vapi ends calls server-side for reasons that never surface as `error` events.
 * Pull the reason out of whatever shape the `call-end` payload arrives in.
 */
export function getCallEndedReason(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') return payload;

  return (
    payload.endedReason ||
    payload.ended_reason ||
    payload.reason ||
    payload.error?.msg ||
    payload.error?.type ||
    null
  );
}

/**
 * Vapi ejections are diagnosed from the full event payload, not just a message,
 * so log the raw object in development.
 */
export function logVapiDiagnostic(eventName, payload) {
  if (!import.meta.env.DEV) return;

  let serialized = payload;
  try {
    serialized = JSON.parse(JSON.stringify(payload));
  } catch {
    // circular payload — fall back to the live object
  }

  console.info(`[vapi:${eventName}]`, serialized, payload);
}
