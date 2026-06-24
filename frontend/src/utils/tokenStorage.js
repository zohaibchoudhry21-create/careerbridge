const TOKEN_KEY = 'cb_auth_token';
const REMEMBER_KEY = 'cb_remember_me';

export const getStoredToken = () => null;

export const setStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
};

export const getRememberMe = () => localStorage.getItem(REMEMBER_KEY) === 'true';
