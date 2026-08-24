import { AlignmentType, BorderStyle } from "docx";

import type { DocumentLanguage as ExamDocumentLanguage } from "@/domain/exam";

export const DOCX_PAGE = {
  widthMm: 210,
  heightMm: 297,
  marginTopMm: 10,
  marginInlineMm: 17.5,
  marginBottomMm: 5,
  contentWidthMm: 175,
} as const;

export const DOCX_TYPOGRAPHY = {
  ar: {
    font: "Traditional Arabic",
    fallbackFont: "Tahoma",
    bodyPt: 12.5,
    metadataPt: 9.5,
    smallPt: 9,
    questionPt: 13,
    sectionPt: 14,
    titlePt: 16,
  },
  fr: {
    font: "Arial",
    fallbackFont: "Arial",
    bodyPt: 10.5,
    metadataPt: 9,
    smallPt: 8.5,
    questionPt: 10.75,
    sectionPt: 11.5,
    titlePt: 15,
  },
} as const;

export const DOCX_SPACING = {
  paragraphAfterPt: 3,
  blockAfterPt: 7.5,
  sectionBeforePt: 10,
  answerLineHeightMm: 5.5,
  answerBoxHeightMm: 24,
  tableCellVerticalMm: 1.3,
  tableCellHorizontalMm: 1.6,
} as const;

export const DOCX_COLORS = {
  text: "111111",
  muted: "525252",
  border: "262626",
  sectionFill: "E8EBE4",
  headerFill: "F2F2F2",
} as const;

export const DOCX_BORDER = {
  style: BorderStyle.SINGLE,
  size: 6,
  color: DOCX_COLORS.border,
} as const;

export function mmToTwips(mm: number): number {
  return Math.round((mm / 25.4) * 1440);
}

export function ptToHalfPoints(pt: number): number {
  return Math.round(pt * 2);
}

export function ptToTwips(pt: number): number {
  return Math.round(pt * 20);
}

export function docxAlignment(language: ExamDocumentLanguage) {
  return language === "ar" ? AlignmentType.RIGHT : AlignmentType.LEFT;
}

export function docxLanguage(language: ExamDocumentLanguage) {
  return language === "ar"
    ? { value: "ar-MA", bidirectional: "ar-MA" }
    : { value: "fr-FR" };
}
