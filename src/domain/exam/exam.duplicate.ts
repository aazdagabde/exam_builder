import type { ExamBlock } from "@/domain/exam/blocks.types";
import type {
  Exam,
  ExamId,
  ExamSection,
  SectionId,
} from "@/domain/exam/exam.types";

export type DuplicateIdKind =
  | "section"
  | "block"
  | "definition-item"
  | "true-false-statement"
  | "multiple-choice-option"
  | "fill-blank"
  | "table-column"
  | "table-row"
  | "matching-left-item"
  | "matching-right-item"
  | "timeline-event"
  | "timeline-period"
  | "chart-category"
  | "chart-series"
  | "essay-topic";

export interface DuplicateIdContext {
  kind: DuplicateIdKind;
  sourceId: string;
}

export interface DuplicateExamOptions {
  id: ExamId;
  now: string;
  createInternalId(context: DuplicateIdContext): string;
}

export interface DuplicateSectionOptions {
  id: SectionId;
  createInternalId(context: DuplicateIdContext): string;
}

export interface DuplicateBlockOptions {
  id?: string;
  createInternalId(context: DuplicateIdContext): string;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported Exam block: ${JSON.stringify(value)}`);
}

export function duplicateBlock(
  block: ExamBlock,
  options: DuplicateBlockOptions,
): ExamBlock {
  const { createInternalId } = options;
  const id =
    options.id ?? createInternalId({ kind: "block", sourceId: block.id });

  switch (block.type) {
    case "instruction":
    case "text-document":
    case "image":
    case "question":
    case "free-text":
    case "separator":
    case "page-break":
      return { ...block, id };

    case "definition":
      return {
        ...block,
        id,
        items: block.items.map((item) => ({
          ...item,
          id: createInternalId({ kind: "definition-item", sourceId: item.id }),
        })),
      };

    case "true-false":
      return {
        ...block,
        id,
        statements: block.statements.map((statement) => ({
          ...statement,
          id: createInternalId({
            kind: "true-false-statement",
            sourceId: statement.id,
          }),
        })),
      };

    case "multiple-choice":
      return {
        ...block,
        id,
        options: block.options.map((option) => ({
          ...option,
          id: createInternalId({
            kind: "multiple-choice-option",
            sourceId: option.id,
          }),
        })),
      };

    case "fill-blank":
      return {
        ...block,
        id,
        segments: block.segments.map((segment) =>
          segment.type === "blank"
            ? {
                ...segment,
                id: createInternalId({
                  kind: "fill-blank",
                  sourceId: segment.id,
                }),
              }
            : { ...segment },
        ),
      };

    case "table": {
      const columnIds = new Map(
        block.columns.map((column) => [
          column.id,
          createInternalId({ kind: "table-column", sourceId: column.id }),
        ]),
      );

      return {
        ...block,
        id,
        columns: block.columns.map((column) => ({
          ...column,
          id: columnIds.get(column.id)!,
        })),
        rows: block.rows.map((row) => ({
          ...row,
          id: createInternalId({ kind: "table-row", sourceId: row.id }),
          cells: row.cells.map((cell) => ({
            ...cell,
            columnId: columnIds.get(cell.columnId) ?? cell.columnId,
          })),
        })),
      };
    }

    case "matching":
      return {
        ...block,
        id,
        leftItems: block.leftItems.map((item) => ({
          ...item,
          id: createInternalId({
            kind: "matching-left-item",
            sourceId: item.id,
          }),
        })),
        rightItems: block.rightItems.map((item) => ({
          ...item,
          id: createInternalId({
            kind: "matching-right-item",
            sourceId: item.id,
          }),
        })),
      };

    case "timeline":
      return {
        ...block,
        id,
        events: block.events.map((event) => ({
          ...event,
          id: createInternalId({
            kind: "timeline-event",
            sourceId: event.id,
          }),
        })),
        scale: block.scale === null ? null : { ...block.scale },
        periods: block.periods.map((period) => ({
          ...period,
          id: createInternalId({
            kind: "timeline-period",
            sourceId: period.id,
          }),
        })),
      };

    case "chart":
      return {
        ...block,
        id,
        labels: block.labels.map((category) => ({
          ...category,
          id: createInternalId({
            kind: "chart-category",
            sourceId: category.id,
          }),
        })),
        series: block.series.map((series) => ({
          ...series,
          id: createInternalId({
            kind: "chart-series",
            sourceId: series.id,
          }),
          values: [...series.values],
        })),
      };

    case "essay":
      return {
        ...block,
        id,
        topics: block.topics.map((topic) => ({
          ...topic,
          id: createInternalId({ kind: "essay-topic", sourceId: topic.id }),
        })),
      };

    default:
      return assertNever(block);
  }
}

export function duplicateSection(
  section: ExamSection,
  { id, createInternalId }: DuplicateSectionOptions,
): ExamSection {
  return {
    ...section,
    id,
    blocks: section.blocks.map((block) =>
      duplicateBlock(block, { createInternalId }),
    ),
  };
}

export function duplicateExam(
  exam: Exam,
  { id, now, createInternalId }: DuplicateExamOptions,
): Exam {
  return {
    ...exam,
    id,
    metadata: { ...exam.metadata },
    studentFields: { ...exam.studentFields },
    settings: {
      ...exam.settings,
      questionNumbering: { ...exam.settings.questionNumbering },
    },
    sections: exam.sections.map((section) =>
      duplicateSection(section, {
        id: createInternalId({ kind: "section", sourceId: section.id }),
        createInternalId,
      }),
    ),
    createdAt: now,
    updatedAt: now,
  };
}
