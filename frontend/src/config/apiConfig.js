const API_ROOT = import.meta.env.VITE_API_URL || '/api';

export const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export const getSocialAuthStatusUrl = () => `${API_ROOT}/auth/social/status`;

export const getSocialAuthUrl = (provider) => {
  if (import.meta.env.DEV) {
    return `/auth/${provider}`;
  }

  return `${BACKEND_ORIGIN}/auth/${provider}`;
};

export const resolveSocialAuthUrl = (provider, authUrl) => {
  if (import.meta.env.DEV) {
    return `/auth/${provider}`;
  }

  return authUrl || getSocialAuthUrl(provider);
};

export default BACKEND_ORIGIN;
