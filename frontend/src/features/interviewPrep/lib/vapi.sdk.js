import Vapi from '@vapi-ai/web';

let vapiInstance = null;

export function getVapiClient() {
  const token = import.meta.env.VITE_VAPI_WEB_TOKEN;

  if (!token) {
    throw new Error('VITE_VAPI_WEB_TOKEN is not configured.');
  }

  if (!vapiInstance) {
    vapiInstance = new Vapi(token);
  }

  return vapiInstance;
}

export function isVapiConfigured() {
  return Boolean(import.meta.env.VITE_VAPI_WEB_TOKEN?.trim());
}
