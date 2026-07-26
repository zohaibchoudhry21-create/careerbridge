import i18n from './index.js';
import { applyDocumentDirection } from './documentDirection.js';
import {
  DEFAULT_I18N_LANGUAGE,
  resolveI18nLanguageCode,
} from './languagePreference.js';

export async function changeAppLanguage(languageCode) {
  const nextLanguage = languageCode || DEFAULT_I18N_LANGUAGE;

  applyDocumentDirection(nextLanguage);

  if (i18n.language !== nextLanguage) {
    await i18n.changeLanguage(nextLanguage);
  }

  return nextLanguage;
}

export async function syncLanguageWithUser(languagePreference) {
  const nextLanguage = languagePreference
    ? resolveI18nLanguageCode(languagePreference)
    : DEFAULT_I18N_LANGUAGE;

  applyDocumentDirection(nextLanguage);

  if (i18n.language !== nextLanguage) {
    await i18n.changeLanguage(nextLanguage);
  }

  return nextLanguage;
}
