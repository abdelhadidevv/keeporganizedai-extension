import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enWizard from './locales/en/wizard.json';
import esCommon from './locales/es/common.json';
import esWizard from './locales/es/wizard.json';
import deCommon from './locales/de/common.json';
import deWizard from './locales/de/wizard.json';
import frCommon from './locales/fr/common.json';
import frWizard from './locales/fr/wizard.json';
import ptBRCommon from './locales/pt-BR/common.json';
import ptBRWizard from './locales/pt-BR/wizard.json';
import arCommon from './locales/ar/common.json';
import arWizard from './locales/ar/wizard.json';

const SUPPORTED_LNGS = ['en', 'es', 'de', 'fr', 'pt-BR', 'ar'];

const RTL_LANGS = ['ar'];

const resources = {
  en: { common: enCommon, wizard: enWizard },
  es: { common: esCommon, wizard: esWizard },
  de: { common: deCommon, wizard: deWizard },
  fr: { common: frCommon, wizard: frWizard },
  'pt-BR': { common: ptBRCommon, wizard: ptBRWizard },
  ar: { common: arCommon, wizard: arWizard },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    supportedLngs: SUPPORTED_LNGS,
    nonExplicitSupportedLngs: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'keeporganized_lng',
    },
  });

export { RTL_LANGS };
export default i18n;
