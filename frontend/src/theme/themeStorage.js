export const THEME_STORAGE_KEY = 'cb_guest_theme';

const listeners = new Set();

function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function normalizeStoredTheme(value) {
  if (value === 'dark') return 'dark';
  if (value === 'light') return 'light';
  if (value === 'system') {
    const resolved = getSystemPrefersDark() ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
    return resolved;
  }
  return 'light';
}

export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return normalizeStoredTheme(stored);
  } catch {
    return 'light';
  }
}

export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.remove('light');
}

export function getIsDark() {
  return readStoredTheme() === 'dark';
}

export function setTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }

  applyThemeToDocument(nextTheme);
  listeners.forEach((listener) => listener());
  return nextTheme;
}

export function setIsDark(isDark) {
  return setTheme(isDark ? 'dark' : 'light');
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function bootstrapTheme() {
  const theme = readStoredTheme();
  applyThemeToDocument(theme);
  return theme;
}
