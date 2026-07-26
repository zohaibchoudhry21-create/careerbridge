import i18n from './index.js';
import {
  DEFAULT_I18N_LANGUAGE,
  resolveI18nLanguageCode,
} from './languagePreference.js';

export async function syncLanguageWithUser(languagePreference) {
  const nextLanguage = languagePreference
    ? resolveI18nLanguageCode(languagePreference)
    : DEFAULT_I18N_LANGUAGE;

  if (i18n.language === nextLanguage) {
    return nextLanguage;
  }

  await i18n.changeLanguage(nextLanguage);
  return nextLanguage;
}
