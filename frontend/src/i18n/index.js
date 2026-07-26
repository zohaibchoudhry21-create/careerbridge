import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_I18N_LANGUAGE, I18N_LANGUAGE_CODES } from './languagePreference.js';
import { applyDocumentDirection } from './documentDirection.js';
import { readGuestLanguage } from './guestLanguageStorage.js';
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enDashboard from './locales/en/dashboard.json';
import esCommon from './locales/es/common.json';
import esSettings from './locales/es/settings.json';
import esDashboard from './locales/es/dashboard.json';
import urCommon from './locales/ur/common.json';
import urSettings from './locales/ur/settings.json';
import urDashboard from './locales/ur/dashboard.json';

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    dashboard: enDashboard,
  },
  es: {
    common: esCommon,
    settings: esSettings,
    dashboard: esDashboard,
  },
  ur: {
    common: urCommon,
    settings: urSettings,
    dashboard: urDashboard,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_I18N_LANGUAGE,
  fallbackLng: DEFAULT_I18N_LANGUAGE,
  supportedLngs: I18N_LANGUAGE_CODES,
  ns: ['common', 'settings', 'dashboard'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  returnNull: false,
  returnEmptyString: false,
});

const guestLanguage = readGuestLanguage();
if (guestLanguage) {
  i18n.changeLanguage(guestLanguage);
}

applyDocumentDirection(i18n.language);

i18n.on('languageChanged', (languageCode) => {
  applyDocumentDirection(languageCode);
});

export default i18n;
