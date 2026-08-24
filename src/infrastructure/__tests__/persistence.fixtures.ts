import { createEmptyExam, type Exam, type ExamBlock } from "@/domain/exam";

export const BASE_TIME = "2026-08-22T10:00:00.000Z";

export function createPersistableExam(
  id: string,
  options: {
    title?: string;
    updatedAt?: string;
    documentLanguage?: "ar" | "fr";
    blocks?: ExamBlock[];
  } = {},
): Exam {
  const exam = createEmptyExam({
    id,
    now: BASE_TIME,
    documentLanguage: options.documentLanguage ?? "fr",
  });

  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title: options.title ?? `Exam ${id}`,
      academicYear: "2026-2027",
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
      totalPoints: 20,
    },
    sections:
      options.blocks === undefined
        ? []
        : [
            {
              id: `section-${id}`,
              title: "التاريخ",
              blocks: options.blocks,
            },
          ],
    updatedAt: options.updatedAt ?? BASE_TIME,
  };
}

export function createComplexBlocks(): ExamBlock[] {
  return [
    {
      id: "question-complex",
      type: "question",
      startsNewQuestion: true,
      order: 0,
      question: "اشرح أسباب ظهور الحركة الوطنية",
      answerMode: "lines",
      answerLines: 3,
      points: 2,
    },
    {
      id: "definition-complex",
      type: "definition",
      startsNewQuestion: true,
      order: 1,
      items: [
        {
          id: "definition-item-complex",
          term: "الحركة الوطنية",
          answerLines: 2,
          points: 0.5,
        },
      ],
    },
    {
      id: "table-complex",
      type: "table",
      startsNewQuestion: true,
      order: 2,
      columns: [{ id: "column-complex", label: "السنة" }],
      rows: [
        {
          id: "row-complex",
          cells: [{ columnId: "column-complex", value: "1956" }],
        },
      ],
      showHeader: true,
      points: 1.5,
    },
    {
      id: "essay-complex",
      type: "essay",
      startsNewQuestion: true,
      order: 3,
      instruction: "اكتب موضوعا مقاليا",
      topics: [{ id: "topic-complex", text: "مقدمة" }],
      points: 7,
    },
    {
      id: "fill-blank-complex",
      type: "fill-blank",
      startsNewQuestion: true,
      order: 4,
      segments: [
        { type: "text", value: "حصل المغرب على الاستقلال سنة " },
        { type: "blank", id: "blank-complex", width: 8 },
      ],
    },
  ];
}
