import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_I18N_LANGUAGE, I18N_LANGUAGE_CODES } from './languagePreference.js';
import { applyDocumentDirection } from './documentDirection.js';
import { readGuestLanguage } from './guestLanguageStorage.js';
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enDashboard from './locales/en/dashboard.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';
import enMarketing from './locales/en/marketing.json';
import enInterviewPrep from './locales/en/interviewPrep.json';
import enResumeBuilder from './locales/en/resumeBuilder.json';
import enResumeScanner from './locales/en/resumeScanner.json';
import esCommon from './locales/es/common.json';
import esSettings from './locales/es/settings.json';
import esDashboard from './locales/es/dashboard.json';
import esAuth from './locales/es/auth.json';
import esErrors from './locales/es/errors.json';
import esMarketing from './locales/es/marketing.json';
import esInterviewPrep from './locales/es/interviewPrep.json';
import esResumeBuilder from './locales/es/resumeBuilder.json';
import esResumeScanner from './locales/es/resumeScanner.json';
import urCommon from './locales/ur/common.json';
import urSettings from './locales/ur/settings.json';
import urDashboard from './locales/ur/dashboard.json';
import urAuth from './locales/ur/auth.json';
import urErrors from './locales/ur/errors.json';
import urMarketing from './locales/ur/marketing.json';
import urInterviewPrep from './locales/ur/interviewPrep.json';
import urResumeBuilder from './locales/ur/resumeBuilder.json';
import urResumeScanner from './locales/ur/resumeScanner.json';

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    dashboard: enDashboard,
    auth: enAuth,
    errors: enErrors,
    marketing: enMarketing,
    interviewPrep: enInterviewPrep,
    resumeBuilder: enResumeBuilder,
    resumeScanner: enResumeScanner,
  },
  es: {
    common: esCommon,
    settings: esSettings,
    dashboard: esDashboard,
    auth: esAuth,
    errors: esErrors,
    marketing: esMarketing,
    interviewPrep: esInterviewPrep,
    resumeBuilder: esResumeBuilder,
    resumeScanner: esResumeScanner,
  },
  ur: {
    common: urCommon,
    settings: urSettings,
    dashboard: urDashboard,
    auth: urAuth,
    errors: urErrors,
    marketing: urMarketing,
    interviewPrep: urInterviewPrep,
    resumeBuilder: urResumeBuilder,
    resumeScanner: urResumeScanner,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_I18N_LANGUAGE,
  fallbackLng: DEFAULT_I18N_LANGUAGE,
  supportedLngs: I18N_LANGUAGE_CODES,
  ns: ['common', 'settings', 'dashboard', 'auth', 'errors', 'marketing', 'interviewPrep', 'resumeBuilder', 'resumeScanner'],
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
