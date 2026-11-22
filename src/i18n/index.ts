import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import en from './en.json';
import ar from './ar.json';

/** English is the base language (owner decision, 22 Nov 2026);
 *  Arabic is available from Settings. RTL flips the whole layout. */
const device = Localization.getLocales()[0]?.languageCode;

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function applyDirection(lang: 'en' | 'ar') {
  const rtl = lang === 'ar';
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    // A direction change needs an app reload (expo-updates reloadAsync).
  }
  void i18n.changeLanguage(lang);
}

export { i18n };
export const deviceLanguage = device;
