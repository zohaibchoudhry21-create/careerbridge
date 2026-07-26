/** Backend `languagePreference` values stored on User. */
export const LANGUAGE_PREFERENCES = ['en-US', 'en-GB', 'es'];

export const DEFAULT_LANGUAGE_PREFERENCE = 'en-US';

/** i18next language codes used in locale folders (partial rollout: en + es). */
export const I18N_LANGUAGE_CODES = ['en', 'es'];

export const DEFAULT_I18N_LANGUAGE = 'en';

/**
 * Map persisted user preference to an i18next language code.
 * French/German and other future prefs fall back to English until translated.
 */
export function resolveI18nLanguageCode(languagePreference) {
  if (languagePreference === 'es') return 'es';
  if (languagePreference === 'en-US' || languagePreference === 'en-GB') return 'en';
  return DEFAULT_I18N_LANGUAGE;
}

export function isSupportedLanguagePreference(value) {
  return LANGUAGE_PREFERENCES.includes(value);
}
