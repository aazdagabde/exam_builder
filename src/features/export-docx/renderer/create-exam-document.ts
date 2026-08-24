import {
  AlignmentType,
  BorderStyle,
  Document,
  PageBorderDisplay,
  PageBorderOffsetFrom,
  PageBorderZOrder,
  PageBreak,
  Paragraph,
  ShadingType,
  type FileChild,
} from "docx";

import {
  computeQuestionNumbering,
  type Exam,
  type ExamSection,
} from "@/domain/exam";
import { getDocumentLabels } from "@/features/exam-renderer/document-labels";
import type { DocxResolvedAssets } from "@/features/export-docx/docx.types";
import { renderExamBlock } from "@/features/export-docx/renderer/docx-block-renderer";
import { renderExamHeader } from "@/features/export-docx/renderer/docx-header";
import {
  paragraph,
  pointsText,
  textRun,
  type DocxRenderContext,
} from "@/features/export-docx/renderer/docx-primitives";
import {
  DOCX_BORDER,
  DOCX_COLORS,
  DOCX_PAGE,
  DOCX_SPACING,
  DOCX_TYPOGRAPHY,
  docxLanguage,
  mmToTwips,
  ptToHalfPoints,
  ptToTwips,
} from "@/features/export-docx/styles/docx-theme";

const EMPTY_ASSETS: DocxResolvedAssets = { images: new Map() };

function pageBreak(context: DocxRenderContext): Paragraph {
  return paragraph(context, [new PageBreak()], { spacing: { after: 0 } });
}

function renderSectionHeading(
  section: ExamSection,
  context: DocxRenderContext,
  pointsLabel: string,
): Paragraph {
  return paragraph(
    context,
    [
      textRun(context, section.title || "\u00a0", {
        bold: true,
        boldComplexScript: true,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].sectionPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].sectionPt,
        ),
      }),
      ...pointsText(context, section.points, pointsLabel),
    ],
    {
      keepNext: true,
      keepLines: true,
      border: {
        top: DOCX_BORDER,
        bottom: { ...DOCX_BORDER, size: 12 },
        left: DOCX_BORDER,
        right: DOCX_BORDER,
      },
      shading: { type: ShadingType.CLEAR, fill: DOCX_COLORS.sectionFill },
      spacing: {
        before: ptToTwips(DOCX_SPACING.sectionBeforePt),
        after: ptToTwips(4),
        line: 280,
      },
    },
  );
}

function hasLaterContent(exam: Exam, sectionIndex: number, blockIndex: number) {
  const section = exam.sections[sectionIndex];
  if (
    section.blocks
      .slice(blockIndex + 1)
      .some((block) => block.type !== "page-break")
  ) {
    return true;
  }
  return exam.sections.slice(sectionIndex + 1).length > 0;
}

/** Page-break blocks are semantic; redundant initial/final/consecutive breaks are removed. */
export function renderExamBody(
  exam: Exam,
  assets: DocxResolvedAssets = EMPTY_ASSETS,
): FileChild[] {
  const context: DocxRenderContext = {
    language: exam.settings.documentLanguage,
  };
  const labels = getDocumentLabels(context.language);
  const children: FileChild[] = [
    ...renderExamHeader(exam, labels, context, assets),
  ];
  const questionNumbers = computeQuestionNumbering(exam);
  let lastWasPageBreak = false;

  exam.sections.forEach((section, sectionIndex) => {
    let firstContentIndex = 0;
    while (section.blocks[firstContentIndex]?.type === "page-break") {
      firstContentIndex += 1;
    }
    if (
      firstContentIndex > 0 &&
      sectionIndex > 0 &&
      children.length > 0 &&
      !lastWasPageBreak
    ) {
      children.push(pageBreak(context));
      lastWasPageBreak = true;
    }

    children.push(renderSectionHeading(section, context, labels.points));
    lastWasPageBreak = false;

    section.blocks.forEach((block, blockIndex) => {
      if (blockIndex < firstContentIndex) return;
      if (block.type === "page-break") {
        if (
          !lastWasPageBreak &&
          hasLaterContent(exam, sectionIndex, blockIndex)
        ) {
          children.push(pageBreak(context));
          lastWasPageBreak = true;
        }
        return;
      }
      children.push(
        ...renderExamBlock(
          block,
          context,
          labels,
          assets,
          questionNumbers.get(block.id),
        ),
      );
      lastWasPageBreak = false;
    });
  });

  while (children.at(-1) instanceof Paragraph && lastWasPageBreak) {
    children.pop();
    lastWasPageBreak = false;
  }
  return children;
}

export function createExamDocument(
  exam: Exam,
  assets: DocxResolvedAssets = EMPTY_ASSETS,
): Document {
  const language = exam.settings.documentLanguage;
  const typography = DOCX_TYPOGRAPHY[language];
  const pageBorder = {
    style: BorderStyle.DOUBLE,
    size: 12,
    color: DOCX_COLORS.border,
    space: 8,
  } as const;

  return new Document({
    creator: "Exam Builder",
    title: exam.metadata.title || "Exam",
    subject: exam.metadata.subject,
    description: "Devoir scolaire éditable généré depuis Exam JSON",
    compatibility: {
      version: 15,
      useFELayout: true,
    },
    styles: {
      default: {
        document: {
          run: {
            font: typography.font,
            size: ptToHalfPoints(typography.bodyPt),
            sizeComplexScript: ptToHalfPoints(typography.bodyPt),
            rightToLeft: language === "ar",
            language: docxLanguage(language),
            color: DOCX_COLORS.text,
          },
          paragraph: {
            alignment:
              language === "ar" ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: {
              after: ptToTwips(DOCX_SPACING.paragraphAfterPt),
              line: 276,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: mmToTwips(DOCX_PAGE.widthMm),
              height: mmToTwips(DOCX_PAGE.heightMm),
            },
            margin: {
              top: mmToTwips(DOCX_PAGE.marginTopMm),
              right: mmToTwips(DOCX_PAGE.marginInlineMm),
              bottom: mmToTwips(DOCX_PAGE.marginBottomMm),
              left: mmToTwips(DOCX_PAGE.marginInlineMm),
              header: mmToTwips(5),
              footer: mmToTwips(5),
            },
            borders: {
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                offsetFrom: PageBorderOffsetFrom.PAGE,
                zOrder: PageBorderZOrder.FRONT,
              },
              pageBorderTop: pageBorder,
              pageBorderRight: pageBorder,
              pageBorderBottom: pageBorder,
              pageBorderLeft: pageBorder,
            },
          },
        },
        children: renderExamBody(exam, assets),
      },
    ],
  });
}
