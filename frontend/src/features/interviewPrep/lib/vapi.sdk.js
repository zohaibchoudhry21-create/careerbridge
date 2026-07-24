import Vapi from '@vapi-ai/web';

let vapiInstance = null;

const getPublicToken = () => import.meta.env.VITE_VAPI_WEB_TOKEN?.trim() || '';

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

export function formatVapiError(error) {
  if (!error) return 'Voice call error.';
  if (typeof error === 'string') return error;

  const nested =
    error.error?.message ||
    error.error?.error ||
    (typeof error.error === 'string' ? error.error : null);

  return (
    error.message ||
    nested ||
    error.msg ||
    error.statusText ||
    (error.type ? `Voice call error (${error.type}).` : null) ||
    'Voice call error. Check your Vapi public key and microphone access.'
  );
}

export function getInterviewStartTarget() {
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID?.trim();
  return assistantId || null;
}
