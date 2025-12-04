import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';
import regional from './locales/regional.json';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: en
      },
      mr: {
        translation: mr
      },
      hi: {
        translation: hi
      },
      regional: {
        translation: regional
      }
    },
    fallbackLng: 'en', // Fallback language if translation is missing
    debug: false, // Set to true for debugging
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },
    
    // Ensure React components re-render on language change
    react: {
      useSuspense: false // Disable suspense to avoid issues
    }
  });

export default i18n;

