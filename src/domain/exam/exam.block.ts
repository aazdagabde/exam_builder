import type {
  ExamBlock,
  ExamBlockType,
  ImageBlock,
} from "@/domain/exam/blocks.types";
import { ExamBlockSchema, ImageBlockSchema } from "@/domain/exam/exam.schema";
import type { Exam } from "@/domain/exam/exam.types";
import { getDefaultStartsNewQuestion } from "@/domain/exam/exam.question-numbering";

export const EXAM_BLOCK_TYPES = [
  "instruction",
  "text-document",
  "image",
  "question",
  "definition",
  "true-false",
  "multiple-choice",
  "fill-blank",
  "table",
  "matching",
  "timeline",
  "chart",
  "essay",
  "free-text",
  "separator",
  "page-break",
] as const satisfies readonly ExamBlockType[];

export type CreatableExamBlockType = Exclude<ExamBlockType, "image">;

export const CREATABLE_EXAM_BLOCK_TYPES = [
  "instruction",
  "text-document",
  "question",
  "definition",
  "true-false",
  "multiple-choice",
  "fill-blank",
  "table",
  "matching",
  "timeline",
  "chart",
  "essay",
  "free-text",
  "separator",
  "page-break",
] as const satisfies readonly CreatableExamBlockType[];

export type CreateBlockInternalIdKind =
  | "definition-item"
  | "multiple-choice-option"
  | "table-column"
  | "timeline-event"
  | "timeline-period"
  | "chart-category"
  | "chart-series";

export interface CreateExamBlockOptions {
  type: CreatableExamBlockType;
  id: string;
  order: number;
  createInternalId(kind: CreateBlockInternalIdKind): string;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported Exam block type: ${value}`);
}

/** Creates the smallest neutral block accepted by the current Domain schema. */
export function createExamBlock({
  type,
  id,
  order,
  createInternalId,
}: CreateExamBlockOptions): ExamBlock {
  let block: ExamBlock;
  const startsNewQuestion = getDefaultStartsNewQuestion(type);

  switch (type) {
    case "instruction":
      block = { id, type, order, content: "", startsNewQuestion };
      break;
    case "text-document":
      block = { id, type, order, content: "", startsNewQuestion };
      break;
    case "question":
      block = {
        id,
        type,
        order,
        question: "",
        answerMode: "lines",
        answerLines: 3,
        startsNewQuestion,
      };
      break;
    case "definition":
      block = {
        id,
        type,
        order,
        items: [
          {
            id: createInternalId("definition-item"),
            term: "",
            answerLines: 3,
          },
        ],
        startsNewQuestion,
      };
      break;
    case "true-false":
      block = { id, type, order, statements: [], startsNewQuestion };
      break;
    case "multiple-choice":
      block = {
        id,
        type,
        order,
        question: "",
        options: [{ id: createInternalId("multiple-choice-option"), text: "" }],
        startsNewQuestion,
      };
      break;
    case "fill-blank":
      block = { id, type, order, segments: [], startsNewQuestion };
      break;
    case "table":
      block = {
        id,
        type,
        order,
        columns: [{ id: createInternalId("table-column"), label: "" }],
        rows: [],
        showHeader: true,
        startsNewQuestion,
      };
      break;
    case "matching":
      block = {
        id,
        type,
        order,
        leftItems: [],
        rightItems: [],
        startsNewQuestion,
      };
      break;
    case "timeline":
      block = {
        id,
        type,
        order,
        title: "",
        events: [
          {
            id: createInternalId("timeline-event"),
            date: "",
            axisValue: null,
            label: "",
            description: "",
          },
        ],
        orientation: "horizontal",
        showDates: true,
        timelineStyle: "historical",
        spacingMode: "scaled",
        chronologyDirection: "ltr",
        scale: { start: 1900, end: 1950, step: 10, unitLabel: "" },
        periods: [],
        scaleCaption: "",
        startsNewQuestion,
      };
      break;
    case "chart":
      block = {
        id,
        type,
        order,
        title: "",
        chartType: "bar",
        labels: [{ id: createInternalId("chart-category"), label: "" }],
        series: [
          {
            id: createInternalId("chart-series"),
            name: "",
            values: [null],
          },
        ],
        showLegend: true,
        showValues: false,
        yAxisLabel: "",
        startsNewQuestion,
      };
      break;
    case "essay":
      block = {
        id,
        type,
        order,
        instruction: "",
        topics: [],
        startsNewQuestion,
      };
      break;
    case "free-text":
      block = { id, type, order, content: "", startsNewQuestion };
      break;
    case "separator":
      block = { id, type, order, startsNewQuestion: false };
      break;
    case "page-break":
      block = { id, type, order, startsNewQuestion: false };
      break;
    default:
      return assertNever(type);
  }

  return ExamBlockSchema.parse(block);
}

export function createImageBlock({
  id,
  order,
  imageId,
}: {
  id: string;
  order: number;
  imageId: string;
}): ImageBlock {
  return ImageBlockSchema.parse({
    id,
    type: "image",
    order,
    imageId,
    alignment: "center",
    startsNewQuestion: getDefaultStartsNewQuestion("image"),
  });
}

/** The array is the primary ordering; the numeric field mirrors its index. */
export function normalizeBlockOrder(blocks: readonly ExamBlock[]): ExamBlock[] {
  return blocks.map((block, order) =>
    block.order === order ? block : { ...block, order },
  );
}

export function countEssayBlocks(exam: Exam): number {
  return exam.sections.reduce(
    (count, section) =>
      count + section.blocks.filter((block) => block.type === "essay").length,
    0,
  );
}
