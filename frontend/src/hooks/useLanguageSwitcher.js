import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from './useAuth';
import { persistLanguagePreference } from '../services/settingsService';
import { changeAppLanguage } from '../i18n/syncLanguage';
import {
  I18N_LANGUAGE_CODES,
  LANGUAGE_DISPLAY_CODES,
  resolveI18nLanguageCode,
  resolveLanguagePreference,
} from '../i18n/languagePreference';
import { writeGuestLanguage } from '../i18n/guestLanguageStorage';
import { getApiErrorMessage } from '../features/interviewPrep/utils/apiErrorUtils';

export const LANGUAGE_SELECTOR_OPTIONS = [
  { i18nCode: 'en', preference: 'en-US' },
  { i18nCode: 'es', preference: 'es' },
  { i18nCode: 'ur', preference: 'ur' },
];

export function useLanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const { isAuthenticated, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const currentI18nCode = I18N_LANGUAGE_CODES.includes(i18n.language)
    ? i18n.language
    : 'en';

  const currentDisplayCode = LANGUAGE_DISPLAY_CODES[currentI18nCode] || 'EN';

  const options = useMemo(
    () =>
      LANGUAGE_SELECTOR_OPTIONS.map((option) => ({
        ...option,
        display: LANGUAGE_DISPLAY_CODES[option.i18nCode],
        label: t(`languageSelector.options.${option.i18nCode}`),
      })),
    [t]
  );

  const setLanguageByI18nCode = useCallback(
    async (i18nCode, { persist = true } = {}) => {
      if (!I18N_LANGUAGE_CODES.includes(i18nCode)) return;

      await changeAppLanguage(i18nCode);

      if (!persist) return;

      writeGuestLanguage(i18nCode);

      if (!isAuthenticated) return;

      const preference = resolveLanguagePreference(i18nCode);
      setIsSaving(true);

      try {
        const result = await persistLanguagePreference(preference);
        if (result?.user) {
          updateUser(result.user);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, t('languageSelector.saveError')));
      } finally {
        setIsSaving(false);
      }
    },
    [isAuthenticated, t, updateUser]
  );

  const setLanguageByPreference = useCallback(
    async (preference) => {
      const i18nCode = resolveI18nLanguageCode(preference);
      await setLanguageByI18nCode(i18nCode);
    },
    [setLanguageByI18nCode]
  );

  return {
    options,
    currentI18nCode,
    currentDisplayCode,
    isSaving,
    setLanguageByI18nCode,
    setLanguageByPreference,
  };
}

export function useLanguageMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return {
    open,
    setOpen,
    containerRef,
    close: () => setOpen(false),
    toggle: () => setOpen((value) => !value),
  };
}
