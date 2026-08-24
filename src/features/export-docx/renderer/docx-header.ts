import {
  AlignmentType,
  ImageRun,
  Paragraph,
  TableRow,
  UnderlineType,
  VerticalAlign,
} from "docx";

import type { Exam } from "@/domain/exam";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";
import type {
  DocxImageData,
  DocxResolvedAssets,
} from "@/features/export-docx/docx.types";
import {
  centeredParagraph,
  nativeTable,
  paragraph,
  tableCell,
  textParagraph,
  textRun,
  type DocxRenderContext,
  type DocxRenderable,
} from "@/features/export-docx/renderer/docx-primitives";
import {
  DOCX_COLORS,
  DOCX_PAGE,
  DOCX_TYPOGRAPHY,
  mmToTwips,
  ptToHalfPoints,
  ptToTwips,
} from "@/features/export-docx/styles/docx-theme";

function visibleMetadataValue(label: string, value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.toLocaleLowerCase().startsWith(label.toLocaleLowerCase())
    ? trimmed
    : `${label}: ${trimmed}`;
}

function titleContainsExamNumber(title: string, examNumber?: string): boolean {
  if (!examNumber?.trim()) return false;
  const escaped = examNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,
    "u",
  ).test(title);
}

function metadataParagraphs(
  context: DocxRenderContext,
  entries: readonly [string, string | undefined][],
): Paragraph[] {
  return entries.flatMap(([label, value]) => {
    const visible = visibleMetadataValue(label, value);
    return visible
      ? [
          textParagraph(context, visible, {
            alignment: AlignmentType.CENTER,
            size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].metadataPt),
            sizeComplexScript: ptToHalfPoints(
              DOCX_TYPOGRAPHY[context.language].metadataPt,
            ),
            spacing: { after: ptToTwips(1), line: 240 },
          }),
        ]
      : [];
  });
}

function scaledImageRun(
  image: DocxImageData,
  maxWidthPx: number,
  maxHeightPx: number,
): ImageRun {
  const scale = Math.min(
    maxWidthPx / image.widthPx,
    maxHeightPx / image.heightPx,
    1,
  );
  return new ImageRun({
    type: image.type,
    data: image.data,
    transformation: {
      width: Math.max(1, Math.round(image.widthPx * scale)),
      height: Math.max(1, Math.round(image.heightPx * scale)),
    },
    altText: {
      name: "Logo institutionnel",
      title: "Logo institutionnel",
      description: "Logo institutionnel",
    },
  });
}

function administrationCell(
  exam: Exam,
  labels: DocumentLabels,
  context: DocxRenderContext,
  assets: DocxResolvedAssets,
) {
  const children: Paragraph[] = [];
  if (assets.institutionalLogo) {
    children.push(
      centeredParagraph(
        context,
        [scaledImageRun(assets.institutionalLogo, 130, 52)],
        { spacing: { after: ptToTwips(1), line: 240 } },
      ),
    );
  }
  children.push(
    ...metadataParagraphs(context, [
      [labels.academy, exam.metadata.regionalAcademy],
      [labels.provincialDirectorate, exam.metadata.provincialDirectorate],
    ]),
  );
  if (children.length === 0) {
    children.push(paragraph(context, [textRun(context, "\u00a0")]));
  }
  return tableCell(children, { verticalAlign: VerticalAlign.CENTER });
}

function titleCell(
  exam: Exam,
  labels: DocumentLabels,
  context: DocxRenderContext,
) {
  const children: Paragraph[] = [];
  if (exam.metadata.title.trim()) {
    children.push(
      textParagraph(context, exam.metadata.title, {
        alignment: AlignmentType.CENTER,
        bold: true,
        boldComplexScript: true,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].titlePt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].titlePt,
        ),
        keepLines: true,
        spacing: { after: ptToTwips(2), line: 280 },
      }),
    );
  }
  const details: string[] = [];
  if (exam.metadata.academicYear.trim()) {
    details.push(`${labels.academicYear}: ${exam.metadata.academicYear}`);
  }
  if (
    exam.metadata.examNumber?.trim() &&
    !titleContainsExamNumber(exam.metadata.title, exam.metadata.examNumber)
  ) {
    details.push(`№ ${exam.metadata.examNumber}`);
  }
  if (
    !exam.studentFields.showGrade &&
    exam.settings.showTotalPoints &&
    exam.metadata.totalPoints !== undefined
  ) {
    details.push(`${labels.total}: ${exam.metadata.totalPoints}`);
  }
  if (details.length > 0) {
    children.push(
      textParagraph(context, details.join(" • "), {
        alignment: AlignmentType.CENTER,
        bold: true,
        boldComplexScript: true,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].smallPt,
        ),
        spacing: { after: 0, line: 220 },
      }),
    );
  }
  return tableCell(
    children.length > 0
      ? children
      : [paragraph(context, [textRun(context, "\u00a0")])],
    { verticalAlign: VerticalAlign.CENTER },
  );
}

function institutionCell(
  exam: Exam,
  labels: DocumentLabels,
  context: DocxRenderContext,
) {
  const children = metadataParagraphs(context, [
    [labels.institution, exam.metadata.institution],
    [labels.level, exam.metadata.level],
    [labels.subject, exam.metadata.subject],
    [labels.teacher, exam.metadata.teacherName],
  ]);
  return tableCell(
    children.length > 0
      ? children
      : [paragraph(context, [textRun(context, "\u00a0")])],
    { verticalAlign: VerticalAlign.CENTER },
  );
}

function studentField(
  context: DocxRenderContext,
  label: string,
  value?: string,
) {
  return tableCell([
    paragraph(context, [
      textRun(context, `${label}: `, {
        bold: true,
        boldComplexScript: true,
        color: DOCX_COLORS.muted,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].smallPt,
        ),
      }),
      textRun(context, value ?? "\u00a0                         ", {
        bold: Boolean(value),
        boldComplexScript: Boolean(value),
        underline: value
          ? undefined
          : { type: UnderlineType.DOTTED, color: DOCX_COLORS.muted },
      }),
    ]),
  ]);
}

export function renderExamHeader(
  exam: Exam,
  labels: DocumentLabels,
  context: DocxRenderContext,
  assets: DocxResolvedAssets,
): DocxRenderable[] {
  const third = mmToTwips(DOCX_PAGE.contentWidthMm / 3);
  const result: DocxRenderable[] = [
    nativeTable({
      context,
      columnWidths: [third, third, third],
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            administrationCell(exam, labels, context, assets),
            titleCell(exam, labels, context),
            institutionCell(exam, labels, context),
          ],
        }),
      ],
    }),
  ];

  const fields: Array<ReturnType<typeof studentField>> = [];
  if (exam.studentFields.showFullName) {
    fields.push(studentField(context, labels.fullName));
  }
  if (exam.studentFields.showStudentNumber) {
    fields.push(studentField(context, labels.studentNumber));
  }
  if (exam.studentFields.showClassName) {
    fields.push(studentField(context, labels.className));
  }
  if (exam.studentFields.showGrade) {
    fields.push(
      studentField(
        context,
        labels.grade,
        `/ ${exam.metadata.totalPoints ?? 20}`,
      ),
    );
  }
  if (fields.length > 0) {
    const rows: TableRow[] = [];
    for (let index = 0; index < fields.length; index += 2) {
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            fields[index],
            fields[index + 1] ??
              tableCell([paragraph(context, [textRun(context, "\u00a0")])]),
          ],
        }),
      );
    }
    const halfWidth = mmToTwips(DOCX_PAGE.contentWidthMm / 2);
    result.push(
      nativeTable({
        context,
        rows,
        columnWidths: [halfWidth, halfWidth],
      }),
    );
  }
  if (exam.metadata.durationMinutes !== undefined) {
    result.push(
      textParagraph(
        context,
        `${labels.duration}: ${exam.metadata.durationMinutes} ${labels.minutes}`,
        {
          alignment: AlignmentType.CENTER,
          bold: true,
          boldComplexScript: true,
          size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].metadataPt),
          sizeComplexScript: ptToHalfPoints(
            DOCX_TYPOGRAPHY[context.language].metadataPt,
          ),
          spacing: { before: ptToTwips(1), after: ptToTwips(5), line: 240 },
        },
      ),
    );
  }
  return result;
}
