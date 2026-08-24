import type {
  DocumentDirection,
  DocumentLanguage,
} from "@/domain/exam/exam.types";

const DOCUMENT_DIRECTION_BY_LANGUAGE: Record<
  DocumentLanguage,
  DocumentDirection
> = {
  ar: "rtl",
  fr: "ltr",
};

export function getDocumentDirection(
  language: DocumentLanguage,
): DocumentDirection {
  return DOCUMENT_DIRECTION_BY_LANGUAGE[language];
}
