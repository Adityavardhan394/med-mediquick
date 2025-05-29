import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import en from './translations/en.json';
import hi from './translations/hi.json';

// Enable RTL for Arabic and Hebrew
const rtlLanguages = ['ar', 'he'];
const isRTL = rtlLanguages.includes(i18n.language);

// Force RTL layout if needed
if (isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      hi: {
        translation: hi,
      },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 