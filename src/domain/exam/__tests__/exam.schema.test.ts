// @vitest-environment node

import {
  ExamBlockSchema,
  ExamSchema,
  FillBlankBlockSchema,
  QuestionBlockSchema,
  TableBlockSchema,
  type QuestionBlock,
} from "@/domain/exam";
import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";

describe("Exam structural schemas", () => {
  it("parses a valid question and preserves discriminated-union narrowing", () => {
    const parsed: QuestionBlock = QuestionBlockSchema.parse({
      id: "question-lines",
      type: "question",
      startsNewQuestion: true,
      order: 0,
      question: "Explain",
      answerMode: "lines",
      answerLines: 2,
    });

    const block = ExamBlockSchema.parse(parsed);
    expect(block.type).toBe("question");

    if (block.type === "question") {
      expect(block.question).toBe("Explain");
      expect(block.answerLines).toBe(2);
    }
  });

  it("rejects question lines with a zero height", () => {
    const result = QuestionBlockSchema.safeParse({
      id: "question-invalid",
      type: "question",
      startsNewQuestion: true,
      order: 0,
      question: "Explain",
      answerMode: "lines",
      answerLines: 0,
    });

    expect(result.success).toBe(false);
  });

  it("rejects lines mode without answerLines and none mode with answerLines", () => {
    expect(
      QuestionBlockSchema.safeParse({
        id: "question-missing-lines",
        type: "question",
        startsNewQuestion: true,
        order: 0,
        question: "Explain",
        answerMode: "lines",
      }).success,
    ).toBe(false);

    expect(
      QuestionBlockSchema.safeParse({
        id: "question-unneeded-lines",
        type: "question",
        startsNewQuestion: true,
        order: 0,
        question: "Explain",
        answerMode: "none",
        answerLines: 2,
      }).success,
    ).toBe(false);
  });

  it("rejects a table without columns", () => {
    expect(
      TableBlockSchema.safeParse({
        id: "table-invalid",
        type: "table",
        startsNewQuestion: true,
        order: 0,
        columns: [],
        rows: [],
        showHeader: true,
      }).success,
    ).toBe(false);
  });

  it("rejects negative decimal points", () => {
    const exam = createTestExam([
      createTestSection([
        {
          id: "question-negative",
          type: "question",
          startsNewQuestion: true,
          order: 0,
          question: "Explain",
          answerMode: "none",
          points: -1,
        },
      ]),
    ]);

    expect(ExamSchema.safeParse(exam).success).toBe(false);
  });

  it("represents fill blanks as typed segments instead of punctuation", () => {
    const block = FillBlankBlockSchema.parse({
      id: "fill-blank-structured",
      type: "fill-blank",
      startsNewQuestion: true,
      order: 0,
      segments: [
        { type: "text", value: "Text " },
        { type: "blank", id: "blank-a" },
        { type: "text", value: " then " },
        { type: "blank", id: "blank-b", width: 10 },
      ],
    });

    expect(block.segments.map((segment) => segment.type)).toEqual([
      "text",
      "blank",
      "text",
      "blank",
    ]);
  });

  it("rejects an unknown block discriminant", () => {
    expect(
      ExamBlockSchema.safeParse({
        id: "unknown-1",
        type: "unknown",
        order: 0,
      }).success,
    ).toBe(false);
  });

  it("parses all 14 supported block discriminants", () => {
    const parsedBlocks = allBlockExamples.map((block) =>
      ExamBlockSchema.parse(block),
    );

    expect(parsedBlocks.map((block) => block.type)).toEqual([
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
      "essay",
      "free-text",
      "separator",
      "page-break",
    ]);
  });

  it("requires current numbering fields instead of applying legacy defaults", () => {
    const exam = createTestExam([createTestSection([allBlockExamples[3]!])]);
    const withoutSettings = structuredClone(exam) as unknown as {
      settings: { questionNumbering?: unknown };
    };
    delete withoutSettings.settings.questionNumbering;

    const withoutMarker = structuredClone(exam) as unknown as {
      sections: Array<{ blocks: Array<{ startsNewQuestion?: boolean }> }>;
    };
    delete withoutMarker.sections[0]!.blocks[0]!.startsNewQuestion;

    expect(ExamSchema.safeParse(withoutSettings).success).toBe(false);
    expect(ExamSchema.safeParse(withoutMarker).success).toBe(false);
    expect(
      ExamBlockSchema.safeParse({
        ...allBlockExamples[12],
        startsNewQuestion: true,
      }).success,
    ).toBe(false);
  });
});
