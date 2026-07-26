import {
  DEFAULT_THEME_PREFERENCE,
  getSystemPrefersDark,
  resolveEffectiveTheme,
} from './themePreference.js';
import { readGuestTheme } from './guestThemeStorage.js';

export function applyResolvedTheme(resolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.classList.remove('light');
}

export function applyThemePreference(themePreference, systemPrefersDark = getSystemPrefersDark()) {
  const resolvedTheme = resolveEffectiveTheme(themePreference, systemPrefersDark);
  applyResolvedTheme(resolvedTheme);
  return resolvedTheme;
}

export function bootstrapDocumentTheme() {
  const preference = readGuestTheme() || DEFAULT_THEME_PREFERENCE;
  return applyThemePreference(preference);
}
