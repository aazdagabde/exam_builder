import {
  AlignmentType,
  BorderStyle,
  HeightRule,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
  type IBorderOptions,
  type IParagraphOptions,
  type IRunOptions,
  type ParagraphChild,
  type TableVerticalAlign,
} from "docx";

import type { DocumentLanguage } from "@/domain/exam";
import {
  DOCX_BORDER,
  DOCX_COLORS,
  DOCX_SPACING,
  DOCX_TYPOGRAPHY,
  docxAlignment,
  docxLanguage,
  mmToTwips,
  ptToHalfPoints,
  ptToTwips,
} from "@/features/export-docx/styles/docx-theme";

export interface DocxRenderContext {
  language: DocumentLanguage;
}

export type DocxRenderable = FileChild;

export function textRun(
  context: DocxRenderContext,
  text: string,
  options: Omit<IRunOptions, "text" | "language" | "rightToLeft"> = {},
): TextRun {
  const typography = DOCX_TYPOGRAPHY[context.language];
  return new TextRun({
    text,
    font: typography.font,
    language: docxLanguage(context.language),
    rightToLeft: context.language === "ar",
    size: ptToHalfPoints(typography.bodyPt),
    sizeComplexScript: ptToHalfPoints(typography.bodyPt),
    color: DOCX_COLORS.text,
    ...options,
  });
}

export function paragraph(
  context: DocxRenderContext,
  children: readonly ParagraphChild[],
  options: Omit<IParagraphOptions, "children" | "bidirectional"> = {},
): Paragraph {
  return new Paragraph({
    children,
    bidirectional: context.language === "ar",
    alignment: docxAlignment(context.language),
    spacing: {
      after: ptToTwips(DOCX_SPACING.paragraphAfterPt),
      line: 276,
      ...options.spacing,
    },
    ...options,
  });
}

export function textParagraph(
  context: DocxRenderContext,
  text: string,
  options: Omit<IParagraphOptions, "children" | "text" | "bidirectional"> &
    Omit<IRunOptions, "text"> = {},
): Paragraph {
  const {
    alignment,
    border,
    keepLines,
    keepNext,
    pageBreakBefore,
    shading,
    spacing,
    style,
    widowControl,
    ...runOptions
  } = options;
  return paragraph(context, [textRun(context, text, runOptions)], {
    alignment,
    border,
    keepLines,
    keepNext,
    pageBreakBefore,
    shading,
    spacing,
    style,
    widowControl,
  });
}

export function pointsText(
  context: DocxRenderContext,
  points: number | undefined,
  pointsLabel: string,
): TextRun[] {
  if (points === undefined) return [];
  return [
    textRun(context, ` (${points} ${pointsLabel})`, {
      bold: true,
      boldComplexScript: true,
      size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
      sizeComplexScript: ptToHalfPoints(
        DOCX_TYPOGRAPHY[context.language].smallPt,
      ),
    }),
  ];
}

export function answerLines(
  context: DocxRenderContext,
  count: number,
): Paragraph[] {
  const dotted: IBorderOptions = {
    style: BorderStyle.DOTTED,
    size: 6,
    color: DOCX_COLORS.text,
  };
  return Array.from({ length: count }, () =>
    paragraph(context, [textRun(context, "\u00a0")], {
      border: { bottom: dotted },
      spacing: {
        after: 0,
        line: mmToTwips(DOCX_SPACING.answerLineHeightMm),
        lineRule: "atLeast",
      },
    }),
  );
}

export function answerBox(context: DocxRenderContext): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allBorders(DOCX_BORDER),
    rows: [
      new TableRow({
        cantSplit: true,
        height: {
          value: mmToTwips(DOCX_SPACING.answerBoxHeightMm),
          rule: HeightRule.ATLEAST,
        },
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.TOP,
            children: [paragraph(context, [textRun(context, "\u00a0")])],
          }),
        ],
      }),
    ],
  });
}

export function allBorders(border: IBorderOptions) {
  return {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };
}

export function borderlessTable() {
  const none: IBorderOptions = {
    style: BorderStyle.NONE,
    size: 0,
    color: "FFFFFF",
  };
  return allBorders(none);
}

export function nativeTable({
  context,
  rows,
  columnWidths,
  borders = allBorders(DOCX_BORDER),
}: {
  context: DocxRenderContext;
  rows: readonly TableRow[];
  columnWidths?: readonly number[];
  borders?: ReturnType<typeof allBorders>;
}): Table {
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders,
    visuallyRightToLeft: context.language === "ar",
    margins: {
      marginUnitType: WidthType.DXA,
      top: mmToTwips(DOCX_SPACING.tableCellVerticalMm),
      bottom: mmToTwips(DOCX_SPACING.tableCellVerticalMm),
      left: mmToTwips(DOCX_SPACING.tableCellHorizontalMm),
      right: mmToTwips(DOCX_SPACING.tableCellHorizontalMm),
    },
  });
}

export function tableCell(
  children: readonly (Paragraph | Table)[],
  options: {
    width?: number;
    header?: boolean;
    verticalAlign?: TableVerticalAlign;
  } = {},
): TableCell {
  return new TableCell({
    children,
    width:
      options.width === undefined
        ? undefined
        : { size: options.width, type: WidthType.DXA },
    verticalAlign: options.verticalAlign ?? VerticalAlign.CENTER,
    shading: options.header
      ? { type: ShadingType.CLEAR, fill: DOCX_COLORS.headerFill }
      : undefined,
  });
}

export function centeredParagraph(
  context: DocxRenderContext,
  children: readonly ParagraphChild[],
  options: Omit<IParagraphOptions, "children" | "bidirectional"> = {},
) {
  return paragraph(context, children, {
    alignment: AlignmentType.CENTER,
    ...options,
  });
}
