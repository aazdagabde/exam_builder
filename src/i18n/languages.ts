export const interfaceLanguages = {
  fr: {
    label: "Français",
    direction: "ltr",
    locale: "fr-MA",
  },
  ar: {
    label: "العربية",
    direction: "rtl",
    locale: "ar-MA",
  },
} as const;

export type InterfaceLanguage = keyof typeof interfaceLanguages;
export type TextDirection =
  (typeof interfaceLanguages)[InterfaceLanguage]["direction"];

export const defaultInterfaceLanguage: InterfaceLanguage = "ar";

export function resolveInterfaceLanguage(language?: string): InterfaceLanguage {
  const languageCode = language?.split("-")[0];

  if (languageCode && languageCode in interfaceLanguages) {
    return languageCode as InterfaceLanguage;
  }

  return defaultInterfaceLanguage;
}
