import { verifyEmail as verifyEmailRequest } from '../services/authService';

const verificationPromises = new Map();

/**
 * Deduplicates verification requests for the same token.
 * Fixes React StrictMode double-mount showing "Verification Failed"
 * after the first request already succeeded.
 */
export const verifyEmailOnce = (token) => {
  if (!verificationPromises.has(token)) {
    const request = verifyEmailRequest(token).catch((error) => {
      verificationPromises.delete(token);
      throw error;
    });

    verificationPromises.set(token, request);
  }

  return verificationPromises.get(token);
};
