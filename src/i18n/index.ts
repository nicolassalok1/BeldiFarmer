import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'
import ar from './locales/ar.json'

const savedLang = localStorage.getItem('anrac-lang') || 'fr'

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

/** Change language + persist + update document direction for RTL */
export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang)
  localStorage.setItem('anrac-lang', lang)
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

// Set initial dir
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'

export default i18n
