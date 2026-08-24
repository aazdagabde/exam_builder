import type { DocumentLanguage } from "@/domain/exam";

export const DEFAULT_SOCIAL_STUDIES_SUBJECT = "الاجتماعيات";
export const DEFAULT_EXAM_TEMPLATE_ID = "moroccan-college-classic";

export const DEFAULT_LEVELS = [
  "الأولى إعدادي",
  "الثانية إعدادي",
  "الثالثة إعدادي",
] as const;

export const DEFAULT_SOCIAL_STUDIES_SECTIONS = [
  "التاريخ",
  "الجغرافيا",
  "التربية على المواطنة",
] as const;

export const DOCUMENT_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: DocumentLanguage;
  label: string;
  direction: "rtl" | "ltr";
}> = [
  { value: "ar", label: "العربية", direction: "rtl" },
  { value: "fr", label: "Français", direction: "ltr" },
];
