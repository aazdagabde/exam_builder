import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "@/i18n/ar.json";
import fr from "@/i18n/fr.json";
import {
  defaultInterfaceLanguage,
  interfaceLanguages,
  type InterfaceLanguage,
} from "@/i18n/languages";
import { readInterfaceLanguageCookie } from "@/i18n/interface-language-cookie";

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: readInterfaceLanguageCookie() ?? defaultInterfaceLanguage,
  fallbackLng: defaultInterfaceLanguage,
  supportedLngs: Object.keys(interfaceLanguages),
  interpolation: {
    escapeValue: false,
  },
  initAsync: false,
});

export async function changeInterfaceLanguage(language: InterfaceLanguage) {
  await i18n.changeLanguage(language);
}

export {
  defaultInterfaceLanguage,
  interfaceLanguages,
  resolveInterfaceLanguage,
  type InterfaceLanguage,
} from "@/i18n/languages";
export {
  INTERFACE_LANGUAGE_COOKIE,
  parseInterfaceLanguageCookie,
  readInterfaceLanguageCookie,
  writeInterfaceLanguageCookie,
} from "@/i18n/interface-language-cookie";
