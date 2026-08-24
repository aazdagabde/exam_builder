import {
  interfaceLanguages,
  resolveInterfaceLanguage,
  type TextDirection,
} from "@/i18n/languages";

export function getTextDirection(language?: string): TextDirection {
  return interfaceLanguages[resolveInterfaceLanguage(language)].direction;
}

export function applyDocumentLanguage(language?: string): void {
  const resolvedLanguage = resolveInterfaceLanguage(language);

  document.documentElement.lang = resolvedLanguage;
  document.documentElement.dir = getTextDirection(resolvedLanguage);
}
