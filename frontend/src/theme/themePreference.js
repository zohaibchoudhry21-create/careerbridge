export const THEME_PREFERENCES = ['light', 'dark', 'system'];

export const DEFAULT_THEME_PREFERENCE = 'light';

export function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : null;
}

export function resolveEffectiveTheme(themePreference, systemPrefersDark = false) {
  if (themePreference === 'dark') return 'dark';
  if (themePreference === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
}

export function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
