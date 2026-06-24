import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export default api;

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const logoutUser = () => api.post('/auth/logout');
const socialCodeExchanges = new Map();

export const exchangeSocialCode = (code) => {
  if (!socialCodeExchanges.has(code)) {
    const request = api.post('/auth/social/exchange', { code }).finally(() => {
      window.setTimeout(() => socialCodeExchanges.delete(code), 60_000);
    });
    socialCodeExchanges.set(code, request);
  }

  return socialCodeExchanges.get(code);
};
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const verifyEmail = (token) => api.get('/verify-email', { params: { token } });
export const resendVerification = (email) => api.post('/auth/resend-verification', { email });
