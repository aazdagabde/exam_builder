import { interfaceLanguages, resolveInterfaceLanguage } from "@/i18n";

export function formatExamUpdatedAt(
  updatedAt: string,
  language?: string,
): string {
  const interfaceLanguage = resolveInterfaceLanguage(language);

  return new Intl.DateTimeFormat(interfaceLanguages[interfaceLanguage].locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt));
}
