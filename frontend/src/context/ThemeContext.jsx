import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useAuth from '../hooks/useAuth';
import {
  DEFAULT_THEME_PREFERENCE,
  normalizeThemePreference,
  resolveEffectiveTheme,
} from '../theme/themePreference';
import { readGuestTheme, writeGuestTheme } from '../theme/guestThemeStorage';
import { applyResolvedTheme } from '../theme/applyTheme';

const ThemeContext = createContext(null);

function readInitialThemePreference() {
  return readGuestTheme() || DEFAULT_THEME_PREFERENCE;
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [themePreference, setThemePreferenceState] = useState(readInitialThemePreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemPrefersDark(event.matches);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (user?.themePreference) {
      const normalized = normalizeThemePreference(user.themePreference);
      if (normalized) {
        setThemePreferenceState(normalized);
      }
      return;
    }

    setThemePreferenceState(readGuestTheme() || DEFAULT_THEME_PREFERENCE);
  }, [user?.themePreference, user]);

  const resolvedTheme = useMemo(
    () => resolveEffectiveTheme(themePreference, systemPrefersDark),
    [themePreference, systemPrefersDark]
  );

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setThemePreference = useCallback((nextPreference) => {
    const normalized = normalizeThemePreference(nextPreference);
    if (!normalized) return;
    setThemePreferenceState(normalized);
    writeGuestTheme(normalized);
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference,
    }),
    [themePreference, resolvedTheme, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
