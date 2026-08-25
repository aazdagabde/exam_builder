import {
  AlignmentType,
  BorderStyle,
  HeightRule,
  ImageRun,
  PageBreak,
  Paragraph,
  Table,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  VerticalAlign,
  WidthType,
  type FileChild,
} from "docx";

import type {
  ExamBlock,
  FillBlankSegment,
  ImageAlignment,
  ImageBlock,
  TableBlock,
} from "@/domain/exam";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";
import type {
  DocxImageData,
  DocxResolvedAssets,
} from "@/features/export-docx/docx.types";
import {
  allBorders,
  answerBox,
  answerLines,
  borderlessTable,
  nativeTable,
  paragraph,
  pointsText,
  tableCell,
  textParagraph,
  textRun,
  type DocxRenderContext,
} from "@/features/export-docx/renderer/docx-primitives";
import {
  DOCX_BORDER,
  DOCX_COLORS,
  DOCX_PAGE,
  DOCX_SPACING,
  DOCX_TYPOGRAPHY,
  mmToTwips,
  ptToHalfPoints,
  ptToTwips,
} from "@/features/export-docx/styles/docx-theme";

function assertNever(value: never): never {
  throw new Error(`Unsupported Exam block: ${JSON.stringify(value)}`);
}

function blockSpacing() {
  return {
    after: ptToTwips(DOCX_SPACING.blockAfterPt),
    line: 276,
  };
}

function instructionParagraph(
  context: DocxRenderContext,
  content: string,
  points: number | undefined,
  labels: DocumentLabels,
): Paragraph {
  return paragraph(
    context,
    [
      textRun(context, content || "\u00a0", {
        bold: true,
        boldComplexScript: true,
      }),
      ...pointsText(context, points, labels.points),
    ],
    { keepNext: true, keepLines: true, spacing: blockSpacing() },
  );
}

function renderInstruction(
  block: Extract<ExamBlock, { type: "instruction" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  return [instructionParagraph(context, block.content, block.points, labels)];
}

function renderTextDocument(
  block: Extract<ExamBlock, { type: "text-document" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const content: Paragraph[] = [];
  if (block.instruction?.trim()) {
    content.push(
      instructionParagraph(context, block.instruction, undefined, labels),
    );
  }
  if (block.title?.trim()) {
    content.push(
      textParagraph(context, block.title, {
        alignment: AlignmentType.CENTER,
        bold: true,
        boldComplexScript: true,
        keepNext: true,
      }),
    );
  }
  content.push(
    textParagraph(context, block.content || "\u00a0", {
      alignment: AlignmentType.JUSTIFIED,
      keepLines: true,
      spacing: { after: ptToTwips(2), line: 300 },
    }),
  );
  if (block.source?.trim()) {
    content.push(
      textParagraph(context, `${labels.source}: ${block.source}`, {
        alignment:
          context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT,
        italics: true,
        italicsComplexScript: true,
        color: DOCX_COLORS.muted,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].smallPt,
        ),
      }),
    );
  }
  if (block.reference?.trim()) {
    content.push(
      textParagraph(context, `${labels.reference}: ${block.reference}`, {
        alignment:
          context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT,
        color: DOCX_COLORS.muted,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].smallPt,
        ),
      }),
    );
  }
  if (block.points !== undefined) {
    content.push(
      paragraph(context, pointsText(context, block.points, labels.points), {
        alignment:
          context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT,
      }),
    );
  }
  return block.bordered
    ? [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          borders: allBorders(DOCX_BORDER),
          rows: [
            new TableRow({ cantSplit: false, children: [tableCell(content)] }),
          ],
        }),
      ]
    : content;
}

function renderQuestion(
  block: Extract<ExamBlock, { type: "question" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const question = paragraph(
    context,
    [
      textRun(context, block.question || "\u00a0", {
        bold: true,
        boldComplexScript: true,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].questionPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].questionPt,
        ),
      }),
      ...pointsText(context, block.points, labels.points),
    ],
    { keepNext: block.answerMode !== "none", keepLines: true },
  );
  if (block.answerMode === "lines") {
    return [question, ...answerLines(context, block.answerLines ?? 1)];
  }
  if (block.answerMode === "box") return [question, answerBox(context)];
  return [question];
}

function renderDefinition(
  block: Extract<ExamBlock, { type: "definition" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const children: FileChild[] = [];
  if (block.instruction?.trim()) {
    children.push(
      instructionParagraph(context, block.instruction, block.points, labels),
    );
  }
  for (const item of block.items) {
    children.push(
      paragraph(
        context,
        [
          textRun(context, item.term || "\u00a0", {
            bold: true,
            boldComplexScript: true,
            size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].questionPt),
            sizeComplexScript: ptToHalfPoints(
              DOCX_TYPOGRAPHY[context.language].questionPt,
            ),
          }),
          ...pointsText(context, item.points, labels.points),
        ],
        { keepNext: true, keepLines: true },
      ),
      ...answerLines(context, item.answerLines),
    );
  }
  return children;
}

function renderTrueFalse(
  block: Extract<ExamBlock, { type: "true-false" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [];
  if (block.instruction?.trim()) {
    result.push(
      instructionParagraph(context, block.instruction, block.points, labels),
    );
  }
  const compact = mmToTwips(13);
  const statement = mmToTwips(DOCX_PAGE.contentWidthMm - 26);
  result.push(
    nativeTable({
      context,
      columnWidths: [statement, compact, compact],
      rows: [
        new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: [
            tableCell(
              [
                textParagraph(context, labels.statement, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  boldComplexScript: true,
                }),
              ],
              { width: statement, header: true },
            ),
            tableCell(
              [
                textParagraph(context, labels.trueLabel, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  boldComplexScript: true,
                }),
              ],
              { width: compact, header: true },
            ),
            tableCell(
              [
                textParagraph(context, labels.falseLabel, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  boldComplexScript: true,
                }),
              ],
              { width: compact, header: true },
            ),
          ],
        }),
        ...block.statements.map(
          (item) =>
            new TableRow({
              cantSplit: true,
              children: [
                tableCell([
                  paragraph(context, [
                    textRun(context, item.text || "\u00a0"),
                    ...pointsText(context, item.points, labels.points),
                  ]),
                ]),
                tableCell([
                  textParagraph(context, "\u00a0", {
                    alignment: AlignmentType.CENTER,
                  }),
                ]),
                tableCell([
                  textParagraph(context, "\u00a0", {
                    alignment: AlignmentType.CENTER,
                  }),
                ]),
              ],
            }),
        ),
      ],
    }),
  );
  return result;
}

function renderMultipleChoice(
  block: Extract<ExamBlock, { type: "multiple-choice" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [
    instructionParagraph(context, block.question, block.points, labels),
  ];
  const marker = block.allowMultipleAnswers ? "☐" : "○";
  for (const option of block.options) {
    result.push(
      paragraph(context, [
        textRun(context, `${marker}  `, { font: "Arial" }),
        textRun(context, option.text || "\u00a0"),
      ]),
    );
  }
  return result;
}

function fillBlankRuns(
  segments: readonly FillBlankSegment[],
  context: DocxRenderContext,
): TextRun[] {
  return segments.map((segment) => {
    if (segment.type === "text") return textRun(context, segment.value);
    const spaces = Math.max(4, Math.min(40, Math.round(segment.width ?? 12)));
    return textRun(context, "\u00a0".repeat(spaces), {
      underline: { type: UnderlineType.SINGLE, color: DOCX_COLORS.text },
    });
  });
}

function renderFillBlank(
  block: Extract<ExamBlock, { type: "fill-blank" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [];
  if (block.instruction?.trim()) {
    result.push(
      instructionParagraph(context, block.instruction, block.points, labels),
    );
  }
  result.push(
    paragraph(context, fillBlankRuns(block.segments, context), {
      spacing: { after: ptToTwips(DOCX_SPACING.blockAfterPt), line: 360 },
    }),
  );
  return result;
}

function tableColumnWidths(block: TableBlock): number[] {
  const weights = block.columns.map((column) => {
    const longest = Math.max(
      8,
      column.label.trim().length,
      ...block.rows.map(
        (row) =>
          row.cells.find((cell) => cell.columnId === column.id)?.value?.trim()
            .length ?? 0,
      ),
    );
    return Math.min(24, longest);
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  const available = mmToTwips(DOCX_PAGE.contentWidthMm);
  return weights.map((weight) => Math.round((weight / total) * available));
}

function renderTable(
  block: TableBlock,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const widths = tableColumnWidths(block);
  const rows: TableRow[] = [];
  if (block.showHeader) {
    rows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: block.columns.map((column, index) =>
          tableCell(
            [
              textParagraph(context, column.label || "\u00a0", {
                alignment: AlignmentType.CENTER,
                bold: true,
                boldComplexScript: true,
                keepLines: true,
              }),
            ],
            { width: widths[index], header: true },
          ),
        ),
      }),
    );
  }
  for (const row of block.rows) {
    rows.push(
      new TableRow({
        cantSplit: true,
        height: { value: mmToTwips(10), rule: HeightRule.ATLEAST },
        children: block.columns.map((column, index) => {
          const value =
            row.cells.find((cell) => cell.columnId === column.id)?.value ?? "";
          return tableCell(
            [
              textParagraph(context, value || "\u00a0", {
                alignment: value ? undefined : AlignmentType.CENTER,
              }),
            ],
            { width: widths[index] },
          );
        }),
      }),
    );
  }
  if (rows.length === 0) {
    rows.push(
      new TableRow({
        cantSplit: true,
        height: { value: mmToTwips(10), rule: HeightRule.ATLEAST },
        children: block.columns.map((_, index) =>
          tableCell([paragraph(context, [textRun(context, "\u00a0")])], {
            width: widths[index],
          }),
        ),
      }),
    );
  }
  const result: FileChild[] = [];
  if (block.points !== undefined) {
    result.push(
      paragraph(context, pointsText(context, block.points, labels.points), {
        alignment:
          context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT,
        keepNext: true,
        spacing: { after: ptToTwips(1), line: 220 },
      }),
    );
  }
  result.push(nativeTable({ context, rows, columnWidths: widths }));
  return result;
}

function renderMatching(
  block: Extract<ExamBlock, { type: "matching" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [];
  if (block.instruction?.trim()) {
    result.push(
      instructionParagraph(context, block.instruction, block.points, labels),
    );
  }
  const outer = mmToTwips((DOCX_PAGE.contentWidthMm - 32) / 2);
  const gap = mmToTwips(32);
  const rowCount = Math.max(block.leftItems.length, block.rightItems.length);
  const visibleRowCount = Math.max(1, rowCount);
  result.push(
    nativeTable({
      context,
      borders: borderlessTable(),
      columnWidths: [outer, gap, outer],
      rows: Array.from(
        { length: visibleRowCount },
        (_, index) =>
          new TableRow({
            cantSplit: true,
            height: { value: mmToTwips(8), rule: HeightRule.ATLEAST },
            children: [
              tableCell([
                textParagraph(
                  context,
                  block.leftItems[index]?.text || "\u00a0",
                  { keepLines: true },
                ),
              ]),
              tableCell([paragraph(context, [textRun(context, "\u00a0")])]),
              tableCell([
                textParagraph(
                  context,
                  block.rightItems[index]?.text || "\u00a0",
                  {
                    alignment:
                      context.language === "ar"
                        ? AlignmentType.LEFT
                        : AlignmentType.RIGHT,
                    keepLines: true,
                  },
                ),
              ]),
            ],
          }),
      ),
    }),
  );
  return result;
}

function renderTimeline(
  block: Extract<ExamBlock, { type: "timeline" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [];
  if (block.title?.trim()) {
    result.push(
      paragraph(
        context,
        [
          textRun(context, block.title, {
            bold: true,
            boldComplexScript: true,
          }),
          ...pointsText(context, block.points, labels.points),
        ],
        { keepNext: true },
      ),
    );
  }
  if (block.timelineStyle === "historical" && block.spacingMode === "scaled") {
    const timelineLabels =
      context.language === "ar"
        ? {
            timeline: "الخط الزمني",
            scale: "المقياس",
            step: "الفاصل",
            date: "التاريخ",
            position: "الموضع",
            event: "الحدث",
            description: "الوصف",
            periods: "الفترات",
            start: "البداية",
            end: "النهاية",
            period: "الفترة",
          }
        : {
            timeline: "Ligne du temps",
            scale: "Échelle",
            step: "pas",
            date: "Date",
            position: "Position",
            event: "Événement",
            description: "Description",
            periods: "Périodes",
            start: "Début",
            end: "Fin",
            period: "Période",
          };
    if (!block.title?.trim()) {
      result.push(
        paragraph(
          context,
          [
            textRun(context, timelineLabels.timeline, {
              bold: true,
              boldComplexScript: true,
            }),
            ...pointsText(context, block.points, labels.points),
          ],
          { keepNext: true },
        ),
      );
    }
    if (block.scale) {
      result.push(
        textParagraph(
          context,
          `${timelineLabels.scale} : ${block.scale.start}–${block.scale.end}, ${timelineLabels.step} ${block.scale.step}${block.scale.unitLabel.trim() ? ` · ${block.scale.unitLabel}` : ""}`,
          { keepNext: true, color: DOCX_COLORS.muted },
        ),
      );
    }
    if (block.scaleCaption.trim()) {
      result.push(
        textParagraph(context, block.scaleCaption, {
          keepNext: true,
          color: DOCX_COLORS.muted,
        }),
      );
    }
    const eventWidth = Math.floor(mmToTwips(DOCX_PAGE.contentWidthMm) / 4);
    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
              timelineLabels.date,
              timelineLabels.position,
              timelineLabels.event,
              timelineLabels.description,
            ].map((value) =>
              tableCell(
                [
                  textParagraph(context, value, {
                    bold: true,
                    boldComplexScript: true,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                { width: eventWidth, header: true },
              ),
            ),
          }),
          ...block.events.map(
            (event) =>
              new TableRow({
                cantSplit: true,
                children: [
                  event.date,
                  event.axisValue === null ? "" : String(event.axisValue),
                  event.label,
                  event.description,
                ].map((value) =>
                  tableCell([textParagraph(context, value || "\u00a0")], {
                    width: eventWidth,
                  }),
                ),
              }),
          ),
        ],
      }),
    );
    if (block.periods.length > 0) {
      result.push(
        textParagraph(context, timelineLabels.periods, {
          bold: true,
          boldComplexScript: true,
          keepNext: true,
        }),
      );
      const periodWidth = Math.floor(mmToTwips(DOCX_PAGE.contentWidthMm) / 3);
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                timelineLabels.start,
                timelineLabels.end,
                timelineLabels.period,
              ].map((value) =>
                tableCell(
                  [
                    textParagraph(context, value, {
                      bold: true,
                      boldComplexScript: true,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  { width: periodWidth, header: true },
                ),
              ),
            }),
            ...block.periods.map(
              (period) =>
                new TableRow({
                  cantSplit: true,
                  children: [
                    String(period.startValue),
                    String(period.endValue),
                    period.label,
                  ].map((value) =>
                    tableCell([textParagraph(context, value || "\u00a0")], {
                      width: periodWidth,
                    }),
                  ),
                }),
            ),
          ],
        }),
      );
    }
    return result;
  }
  block.events.forEach((event, index) => {
    const date = block.showDates && event.date.trim() ? `${event.date} — ` : "";
    result.push(
      paragraph(
        context,
        [
          textRun(context, `${date}${event.label || "\u00a0"}`, {
            bold: true,
            boldComplexScript: true,
          }),
          ...(index === block.events.length - 1 && !block.title?.trim()
            ? pointsText(context, block.points, labels.points)
            : []),
        ],
        { keepNext: Boolean(event.description?.trim()), keepLines: true },
      ),
    );
    if (event.description?.trim()) {
      result.push(
        textParagraph(context, event.description, {
          color: DOCX_COLORS.muted,
          keepLines: true,
        }),
      );
    }
  });
  return result;
}

function chartTypeLabel(
  type: Extract<ExamBlock, { type: "chart" }>["chartType"],
  language: DocxRenderContext["language"],
): string {
  const labels =
    language === "ar"
      ? { bar: "أعمدة", line: "منحنى", pie: "دائري" }
      : { bar: "Barres", line: "Courbe", pie: "Circulaire" };
  return labels[type];
}

function renderChart(
  block: Extract<ExamBlock, { type: "chart" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [
    paragraph(
      context,
      [
        textRun(
          context,
          `${labels.chart}${block.title?.trim() ? ` : ${block.title}` : ""}`,
          { bold: true, boldComplexScript: true },
        ),
        ...pointsText(context, block.points, labels.points),
      ],
      { keepNext: true },
    ),
    textParagraph(
      context,
      `${labels.chartType} : ${chartTypeLabel(block.chartType, context.language)}`,
      { keepNext: true, color: DOCX_COLORS.muted },
    ),
  ];
  const columnCount = 1 + block.series.length;
  const width = Math.floor(mmToTwips(DOCX_PAGE.contentWidthMm) / columnCount);
  const rows = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        labels.category,
        ...block.series.map((series) => series.name),
      ].map((value) =>
        tableCell(
          [
            textParagraph(context, value || "\u00a0", {
              bold: true,
              boldComplexScript: true,
              alignment: AlignmentType.CENTER,
            }),
          ],
          { width, header: true },
        ),
      ),
    }),
    ...block.labels.map(
      (category, categoryIndex) =>
        new TableRow({
          cantSplit: true,
          children: [
            tableCell([textParagraph(context, category.label || "\u00a0")], {
              width,
            }),
            ...block.series.map((series) =>
              tableCell(
                [
                  textParagraph(
                    context,
                    series.values[categoryIndex] === null ||
                      series.values[categoryIndex] === undefined
                      ? "\u00a0"
                      : String(series.values[categoryIndex]),
                    { alignment: AlignmentType.CENTER },
                  ),
                ],
                { width },
              ),
            ),
          ],
        }),
    ),
  ];
  result.push(
    nativeTable({
      context,
      rows,
      columnWidths: Array.from({ length: columnCount }, () => width),
    }),
  );
  return result;
}

function diagramNodeText(
  block: Extract<ExamBlock, { type: "diagram" }>,
  nodeId: string,
): string {
  return block.nodes.find((node) => node.id === nodeId)?.text || "…";
}

function renderDiagram(
  block: Extract<ExamBlock, { type: "diagram" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const result: FileChild[] = [
    paragraph(
      context,
      [
        textRun(context, block.title.trim() || labels.diagram, {
          bold: true,
          boldComplexScript: true,
        }),
        ...pointsText(context, block.points, labels.points),
      ],
      { alignment: AlignmentType.CENTER, keepNext: true },
    ),
  ];

  if (block.layout === "horizontal-flow") {
    result.push(
      textParagraph(
        context,
        block.nodes.map((node) => node.text || "…").join(" → ") || "…",
        { alignment: AlignmentType.CENTER, keepLines: true },
      ),
    );
  } else if (block.layout === "vertical-flow") {
    block.nodes.forEach((node, index) => {
      result.push(
        textParagraph(context, node.text || "…", {
          alignment: AlignmentType.CENTER,
          keepNext: index < block.nodes.length - 1,
          keepLines: true,
        }),
      );
      if (index < block.nodes.length - 1) {
        result.push(
          textParagraph(context, "↓", {
            alignment: AlignmentType.CENTER,
            keepNext: true,
          }),
        );
      }
    });
  } else {
    const incoming = new Set(block.edges.map((edge) => edge.toNodeId));
    const roots = block.nodes.filter((node) => !incoming.has(node.id));
    const startingNodes = roots.length > 0 ? roots : block.nodes;
    const visited = new Set<string>();
    const visit = (nodeId: string, depth: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      result.push(
        textParagraph(
          context,
          `${depth === 0 ? "" : `${"  ".repeat(depth - 1)}├ `}${diagramNodeText(block, nodeId)}`,
          { keepLines: true },
        ),
      );
      block.edges
        .filter((edge) => edge.fromNodeId === nodeId)
        .forEach((edge) => visit(edge.toNodeId, depth + 1));
    };
    startingNodes.forEach((node) => visit(node.id, 0));
    block.nodes.forEach((node) => visit(node.id, 0));
  }

  if (block.edges.length > 0) {
    result.push(
      textParagraph(
        context,
        context.language === "ar" ? "العلاقات" : "Relations",
        { bold: true, boldComplexScript: true, keepNext: true },
      ),
    );
    block.edges.forEach((edge) => {
      const label = edge.label.trim() ? ` — ${edge.label} → ` : " → ";
      result.push(
        textParagraph(
          context,
          `${diagramNodeText(block, edge.fromNodeId)}${label}${diagramNodeText(block, edge.toNodeId)}`,
          { keepLines: true },
        ),
      );
    });
  }
  return result;
}

function renderEssay(
  block: Extract<ExamBlock, { type: "essay" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const content: Paragraph[] = [];
  if (block.context?.trim()) {
    content.push(
      paragraph(context, [
        textRun(context, `${labels.context}: `, {
          bold: true,
          boldComplexScript: true,
        }),
        textRun(context, block.context),
      ]),
    );
  }
  content.push(
    paragraph(
      context,
      [
        textRun(context, block.instruction || "\u00a0", {
          bold: true,
          boldComplexScript: true,
        }),
        ...pointsText(context, block.points, labels.points),
      ],
      { keepNext: block.topics.length > 0 },
    ),
  );
  block.topics.forEach((topic, index) => {
    content.push(
      textParagraph(context, `${index + 1}. ${topic.text || "\u00a0"}`, {
        keepLines: true,
      }),
    );
  });
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: allBorders(DOCX_BORDER),
      rows: [
        new TableRow({ cantSplit: false, children: [tableCell(content)] }),
      ],
    }),
  ];
}

function renderFreeText(
  block: Extract<ExamBlock, { type: "free-text" }>,
  context: DocxRenderContext,
  labels: DocumentLabels,
): FileChild[] {
  const runOptions =
    block.variant === "subtitle"
      ? {
          bold: true,
          boldComplexScript: true,
          size: ptToHalfPoints(11),
          sizeComplexScript: ptToHalfPoints(11),
        }
      : block.variant === "note"
        ? {
            italics: true,
            italicsComplexScript: true,
            color: DOCX_COLORS.muted,
            size: ptToHalfPoints(9.5),
            sizeComplexScript: ptToHalfPoints(9.5),
          }
        : {};
  return [
    paragraph(
      context,
      [
        textRun(context, block.content || "\u00a0", runOptions),
        ...pointsText(context, block.points, labels.points),
      ],
      {
        keepNext: block.variant === "subtitle",
        border:
          block.variant === "subtitle" ? { bottom: DOCX_BORDER } : undefined,
        spacing: blockSpacing(),
      },
    ),
  ];
}

function imageAlignment(
  alignment: ImageAlignment | undefined,
  context: DocxRenderContext,
) {
  if (alignment === "center" || alignment === undefined) {
    return AlignmentType.CENTER;
  }
  if (alignment === "start") {
    return context.language === "ar" ? AlignmentType.RIGHT : AlignmentType.LEFT;
  }
  return context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT;
}

function createImageRun(block: ImageBlock, image: DocxImageData): ImageRun {
  const maxWidth = Math.round(
    680 * (Math.min(100, Math.max(1, block.width ?? 100)) / 100),
  );
  const maxHeight = 586;
  const scale = Math.min(maxWidth / image.widthPx, maxHeight / image.heightPx);
  return new ImageRun({
    type: image.type,
    data: image.data,
    transformation: {
      width: Math.max(1, Math.round(image.widthPx * scale)),
      height: Math.max(1, Math.round(image.heightPx * scale)),
    },
    altText: {
      name: block.title || block.caption || "Image du devoir",
      title: block.title || "Image du devoir",
      description: block.caption || block.source || "Image du devoir",
    },
  });
}

function imagePlaceholder(
  context: DocxRenderContext,
  labels: DocumentLabels,
): Table {
  const dashed = {
    style: BorderStyle.DASHED,
    size: 6,
    color: DOCX_COLORS.muted,
  } as const;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allBorders(dashed),
    rows: [
      new TableRow({
        cantSplit: true,
        height: { value: mmToTwips(35), rule: HeightRule.ATLEAST },
        children: [
          tableCell(
            [
              textParagraph(context, labels.imageUnavailable, {
                alignment: AlignmentType.CENTER,
                color: DOCX_COLORS.muted,
              }),
            ],
            { verticalAlign: VerticalAlign.CENTER },
          ),
        ],
      }),
    ],
  });
}

function renderImage(
  block: ImageBlock,
  context: DocxRenderContext,
  labels: DocumentLabels,
  assets: DocxResolvedAssets,
): FileChild[] {
  const result: FileChild[] = [];
  if (block.title?.trim()) {
    result.push(
      paragraph(
        context,
        [
          textRun(context, block.title, {
            bold: true,
            boldComplexScript: true,
          }),
          ...pointsText(context, block.points, labels.points),
        ],
        { alignment: AlignmentType.CENTER, keepNext: true },
      ),
    );
  }
  const image = assets.images.get(block.imageId);
  if (image) {
    const imageParagraph = paragraph(context, [createImageRun(block, image)], {
      alignment: imageAlignment(block.alignment, context),
      keepLines: true,
    });
    result.push(
      block.bordered
        ? new Table({
            width: {
              size: Math.min(100, Math.max(1, block.width ?? 100)),
              type: WidthType.PERCENTAGE,
            },
            layout: TableLayoutType.FIXED,
            alignment: imageAlignment(block.alignment, context),
            borders: allBorders(DOCX_BORDER),
            rows: [
              new TableRow({
                cantSplit: true,
                children: [tableCell([imageParagraph])],
              }),
            ],
          })
        : imageParagraph,
    );
  } else {
    result.push(imagePlaceholder(context, labels));
  }
  if (block.caption?.trim()) {
    result.push(
      textParagraph(context, block.caption, {
        alignment: AlignmentType.CENTER,
        italics: true,
        italicsComplexScript: true,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].smallPt,
        ),
      }),
    );
  }
  if (block.source?.trim()) {
    result.push(
      textParagraph(context, `${labels.source}: ${block.source}`, {
        alignment:
          context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT,
        color: DOCX_COLORS.muted,
        size: ptToHalfPoints(DOCX_TYPOGRAPHY[context.language].smallPt),
        sizeComplexScript: ptToHalfPoints(
          DOCX_TYPOGRAPHY[context.language].smallPt,
        ),
      }),
    );
  }
  if (!block.title?.trim() && block.points !== undefined) {
    result.push(
      paragraph(context, pointsText(context, block.points, labels.points), {
        alignment:
          context.language === "ar" ? AlignmentType.LEFT : AlignmentType.RIGHT,
      }),
    );
  }
  return result;
}

function renderSeparator(
  block: Extract<ExamBlock, { type: "separator" }>,
  context: DocxRenderContext,
): FileChild[] {
  if (block.style === "space") {
    return [
      paragraph(context, [textRun(context, "\u00a0")], {
        spacing: { after: mmToTwips(6), line: 120 },
      }),
    ];
  }
  return [
    paragraph(context, [textRun(context, "\u00a0")], {
      border: { bottom: DOCX_BORDER },
      spacing: { after: ptToTwips(4), line: 120 },
    }),
  ];
}

function renderPageBreak(context: DocxRenderContext): FileChild[] {
  return [paragraph(context, [new PageBreak()], { spacing: { after: 0 } })];
}

export function renderExamBlock(
  block: ExamBlock,
  context: DocxRenderContext,
  labels: DocumentLabels,
  assets: DocxResolvedAssets,
  questionNumber?: number,
): FileChild[] {
  let content: FileChild[];
  switch (block.type) {
    case "instruction":
      content = renderInstruction(block, context, labels);
      break;
    case "text-document":
      content = renderTextDocument(block, context, labels);
      break;
    case "image":
      content = renderImage(block, context, labels, assets);
      break;
    case "question":
      content = renderQuestion(block, context, labels);
      break;
    case "definition":
      content = renderDefinition(block, context, labels);
      break;
    case "true-false":
      content = renderTrueFalse(block, context, labels);
      break;
    case "multiple-choice":
      content = renderMultipleChoice(block, context, labels);
      break;
    case "fill-blank":
      content = renderFillBlank(block, context, labels);
      break;
    case "table":
      content = renderTable(block, context, labels);
      break;
    case "matching":
      content = renderMatching(block, context, labels);
      break;
    case "timeline":
      content = renderTimeline(block, context, labels);
      break;
    case "chart":
      content = renderChart(block, context, labels);
      break;
    case "diagram":
      content = renderDiagram(block, context, labels);
      break;
    case "essay":
      content = renderEssay(block, context, labels);
      break;
    case "free-text":
      content = renderFreeText(block, context, labels);
      break;
    case "separator":
      content = renderSeparator(block, context);
      break;
    case "page-break":
      content = renderPageBreak(context);
      break;
    default:
      return assertNever(block);
  }

  if (questionNumber === undefined) return content;
  const marker = paragraph(
    context,
    [
      textRun(context, `${questionNumber}-`, {
        bold: true,
        boldComplexScript: true,
      }),
    ],
    {
      keepNext: true,
      keepLines: true,
      spacing: { after: 0, line: 240 },
    },
  );
  return [marker, ...content];
}
