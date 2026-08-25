import {
  createEmptyExam,
  type EssayBlock,
  type Exam,
  type ExamBlock,
  type ExamSection,
} from "@/domain/exam";

export const FIXED_NOW = "2026-08-22T12:00:00.000Z";

export const allBlockExamples: ExamBlock[] = [
  {
    id: "instruction-1",
    type: "instruction",
    startsNewQuestion: false,
    order: 0,
    content: "Read carefully",
  },
  {
    id: "document-1",
    type: "text-document",
    startsNewQuestion: false,
    order: 1,
    title: "Document",
    content: "Historical source",
    source: "Archive",
  },
  {
    id: "image-1",
    type: "image",
    startsNewQuestion: false,
    order: 2,
    imageId: "resource-1",
    alignment: "center",
  },
  {
    id: "question-1",
    type: "question",
    startsNewQuestion: true,
    order: 3,
    question: "Explain the event",
    answerMode: "lines",
    answerLines: 3,
  },
  {
    id: "definition-1",
    type: "definition",
    startsNewQuestion: true,
    order: 4,
    items: [{ id: "definition-item-1", term: "Independence", answerLines: 2 }],
  },
  {
    id: "true-false-1",
    type: "true-false",
    startsNewQuestion: true,
    order: 5,
    statements: [{ id: "statement-1", text: "The statement" }],
  },
  {
    id: "multiple-choice-1",
    type: "multiple-choice",
    startsNewQuestion: true,
    order: 6,
    question: "Choose an answer",
    options: [{ id: "option-1", text: "First option" }],
  },
  {
    id: "fill-blank-1",
    type: "fill-blank",
    startsNewQuestion: true,
    order: 7,
    segments: [
      { type: "text", value: "Morocco became independent in " },
      { type: "blank", id: "blank-1", width: 8 },
      { type: "text", value: ". The event happened in " },
      { type: "blank", id: "blank-2" },
    ],
  },
  {
    id: "table-1",
    type: "table",
    startsNewQuestion: true,
    order: 8,
    columns: [{ id: "column-1", label: "Year" }],
    rows: [{ id: "row-1", cells: [{ columnId: "column-1", value: "1956" }] }],
    showHeader: true,
  },
  {
    id: "matching-1",
    type: "matching",
    startsNewQuestion: true,
    order: 9,
    leftItems: [{ id: "left-1", text: "Independence" }],
    rightItems: [{ id: "right-1", text: "1956" }],
  },
  {
    id: "essay-1",
    type: "essay",
    startsNewQuestion: true,
    order: 10,
    instruction: "Write an essay",
    topics: [{ id: "topic-1", text: "Introduction" }],
  },
  {
    id: "free-text-1",
    type: "free-text",
    startsNewQuestion: false,
    order: 11,
    content: "Important note",
    variant: "note",
  },
  {
    id: "separator-1",
    type: "separator",
    startsNewQuestion: false,
    order: 12,
    style: "line",
  },
  {
    id: "page-break-1",
    type: "page-break",
    startsNewQuestion: false,
    order: 13,
  },
  {
    id: "timeline-1",
    type: "timeline",
    startsNewQuestion: true,
    order: 14,
    title: "Moroccan independence",
    events: [
      {
        id: "timeline-event-1",
        date: "1912",
        label: "Protectorate",
        description: "Beginning of the protectorate",
      },
      {
        id: "timeline-event-2",
        date: "1956",
        label: "Independence",
      },
    ],
    orientation: "horizontal",
    showDates: true,
  },
  {
    id: "chart-1",
    type: "chart",
    startsNewQuestion: true,
    order: 15,
    title: "Population",
    chartType: "bar",
    labels: [
      { id: "chart-category-1", label: "1960" },
      { id: "chart-category-2", label: "1970" },
    ],
    series: [{ id: "chart-series-1", name: "Population", values: [12, 15.5] }],
    showLegend: true,
    showValues: true,
    yAxisLabel: "Millions",
  },
];

export function createTestSection(
  blocks: ExamBlock[] = [],
  options: { id?: string; title?: string; points?: number } = {},
): ExamSection {
  return {
    id: options.id ?? "section-1",
    title: options.title ?? "History",
    ...(options.points === undefined ? {} : { points: options.points }),
    blocks,
  };
}

export function createTestExam(
  sections: ExamSection[] = [],
  options: { title?: string; totalPoints?: number } = {},
): Exam {
  const emptyExam = createEmptyExam({
    id: "exam-1",
    now: FIXED_NOW,
    documentLanguage: "ar",
  });

  return {
    ...emptyExam,
    metadata: {
      ...emptyExam.metadata,
      title: options.title ?? "Test exam",
      ...(options.totalPoints === undefined
        ? {}
        : { totalPoints: options.totalPoints }),
    },
    sections,
  };
}

export function createEssayBlock(
  id: string,
  order = 0,
  points?: number,
): EssayBlock {
  return {
    id,
    type: "essay",
    startsNewQuestion: true,
    order,
    instruction: "Write an essay",
    topics: [],
    ...(points === undefined ? {} : { points }),
  };
}
