import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from './useAuth';
import useTheme from './useTheme';
import { persistThemePreference } from '../services/settingsService';
import { getApiErrorMessage } from '../features/interviewPrep/utils/apiErrorUtils';

const THEME_CYCLE = ['light', 'dark', 'system'];

export function useThemeSwitcher() {
  const { t } = useTranslation('common');
  const { isAuthenticated, updateUser } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const nextThemePreference = useMemo(() => {
    const currentIndex = THEME_CYCLE.indexOf(themePreference);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % THEME_CYCLE.length;
    return THEME_CYCLE[nextIndex];
  }, [themePreference]);

  const cycleTheme = useCallback(async () => {
    const nextPreference = nextThemePreference;

    setThemePreference(nextPreference);

    if (!isAuthenticated) return;

    setIsSaving(true);

    try {
      const result = await persistThemePreference(nextPreference);
      if (result?.user) {
        updateUser(result.user);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('themeToggle.saveError')));
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, nextThemePreference, setThemePreference, t, updateUser]);

  return {
    themePreference,
    nextThemePreference,
    cycleTheme,
    isSaving,
  };
}
