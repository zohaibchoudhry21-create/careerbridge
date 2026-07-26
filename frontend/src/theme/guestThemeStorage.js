import { normalizeThemePreference } from './themePreference.js';

export const GUEST_THEME_STORAGE_KEY = 'cb_guest_theme';

export function readGuestTheme() {
  try {
    const stored = localStorage.getItem(GUEST_THEME_STORAGE_KEY);
    return normalizeThemePreference(stored);
  } catch {
    return null;
  }
}

export function writeGuestTheme(themePreference) {
  try {
    localStorage.setItem(GUEST_THEME_STORAGE_KEY, themePreference);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}
