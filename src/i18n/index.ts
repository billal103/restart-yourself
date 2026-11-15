import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import bnCommon from './locales/bn/common.json'
import enCommon from './locales/en/common.json'

// Milestone 1 scope: navigation/chrome strings only. Full page-content
// translation coverage is a Milestone 3 deliverable (spec section 3.12).
void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      bn: { common: bnCommon },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'bn'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

export default i18next
