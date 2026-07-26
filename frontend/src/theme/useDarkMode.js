import { useCallback, useSyncExternalStore } from 'react';
import { getIsDark, setIsDark, subscribe, readStoredTheme } from './themeStorage';

function getSnapshot() {
  return readStoredTheme() === 'dark';
}

function getServerSnapshot() {
  return false;
}

export function useDarkMode() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    setIsDark(!getIsDark());
  }, []);

  const setDark = useCallback((nextIsDark) => {
    setIsDark(nextIsDark);
  }, []);

  return { isDark, toggle, setDark };
}
