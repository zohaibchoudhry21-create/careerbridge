import { useCallback, useState } from 'react';

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export default function usePersistedSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  return { collapsed, toggleCollapsed };
}
