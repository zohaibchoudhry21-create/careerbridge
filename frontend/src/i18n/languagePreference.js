/** Backend `languagePreference` values stored on User. */
export const LANGUAGE_PREFERENCES = ['en-US', 'en-GB', 'es', 'ur'];

export const DEFAULT_LANGUAGE_PREFERENCE = 'en-US';

/** i18next language codes used in locale folders. */
export const I18N_LANGUAGE_CODES = ['en', 'es', 'ur'];

export const DEFAULT_I18N_LANGUAGE = 'en';

/** Short display codes for language selectors (navbar, etc.). */
export const LANGUAGE_DISPLAY_CODES = {
  en: 'EN',
  es: 'ES',
  ur: 'UR',
};

/**
 * Map persisted user preference to an i18next language code.
 */
export function resolveI18nLanguageCode(languagePreference) {
  if (languagePreference === 'es') return 'es';
  if (languagePreference === 'ur') return 'ur';
  if (languagePreference === 'en-US' || languagePreference === 'en-GB') return 'en';
  return DEFAULT_I18N_LANGUAGE;
}

/** Map i18next language code back to a stored user preference. */
export function resolveLanguagePreference(i18nLanguageCode) {
  if (i18nLanguageCode === 'es') return 'es';
  if (i18nLanguageCode === 'ur') return 'ur';
  return 'en-US';
}

export function isSupportedLanguagePreference(value) {
  return LANGUAGE_PREFERENCES.includes(value);
}
