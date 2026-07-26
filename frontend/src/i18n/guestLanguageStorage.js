import { I18N_LANGUAGE_CODES } from './languagePreference.js';

export const GUEST_LANGUAGE_STORAGE_KEY = 'cb_guest_language';

export function readGuestLanguage() {
  try {
    const stored = localStorage.getItem(GUEST_LANGUAGE_STORAGE_KEY);
    return I18N_LANGUAGE_CODES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeGuestLanguage(i18nCode) {
  try {
    localStorage.setItem(GUEST_LANGUAGE_STORAGE_KEY, i18nCode);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}
