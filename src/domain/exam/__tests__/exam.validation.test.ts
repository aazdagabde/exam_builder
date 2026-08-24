// @vitest-environment node

import {
  ExamValidationCode,
  validateExam,
  type ExamBlock,
  type QuestionBlock,
} from "@/domain/exam";
import {
  allBlockExamples,
  createEssayBlock,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";

function issuesWithCode(
  exam: ReturnType<typeof createTestExam>,
  code: ExamValidationCode,
) {
  return validateExam(exam).filter((issue) => issue.code === code);
}

describe("Exam business validation", () => {
  it("accepts zero or one essay under the uniqueness rule", () => {
    const withoutEssay = createTestExam([createTestSection([])]);
    const withEssay = createTestExam([
      createTestSection([createEssayBlock("essay-1")]),
    ]);

    expect(
      issuesWithCode(withoutEssay, ExamValidationCode.MULTIPLE_ESSAY_BLOCKS),
    ).toHaveLength(0);
    expect(
      issuesWithCode(withEssay, ExamValidationCode.MULTIPLE_ESSAY_BLOCKS),
    ).toHaveLength(0);
  });

  it("returns exactly one error for essays in two different sections", () => {
    const exam = createTestExam([
      createTestSection([createEssayBlock("essay-1")], { id: "section-a" }),
      createTestSection([createEssayBlock("essay-2")], { id: "section-b" }),
    ]);

    const issues = issuesWithCode(
      exam,
      ExamValidationCode.MULTIPLE_ESSAY_BLOCKS,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("error");
  });

  it("warns for each empty matching column", () => {
    const matchingBlocks: ExamBlock[] = [
      {
        id: "matching-left-empty",
        type: "matching",
        startsNewQuestion: true,
        order: 0,
        leftItems: [],
        rightItems: [{ id: "right-1", text: "1956" }],
      },
      {
        id: "matching-right-empty",
        type: "matching",
        startsNewQuestion: true,
        order: 1,
        leftItems: [{ id: "left-1", text: "Independence" }],
        rightItems: [],
      },
    ];
    const exam = createTestExam([createTestSection(matchingBlocks)]);

    expect(
      issuesWithCode(exam, ExamValidationCode.MATCHING_LEFT_EMPTY),
    ).toHaveLength(1);
    expect(
      issuesWithCode(exam, ExamValidationCode.MATCHING_RIGHT_EMPTY),
    ).toHaveLength(1);
  });

  it("warns when a section title is blank", () => {
    const exam = createTestExam([createTestSection([], { title: "   " })]);
    const issues = issuesWithCode(
      exam,
      ExamValidationCode.SECTION_TITLE_MISSING,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: "warning",
      sectionId: "section-1",
    });
  });

  it("warns when a question contains only whitespace", () => {
    const question: QuestionBlock = {
      id: "question-empty",
      type: "question",
      startsNewQuestion: true,
      order: 0,
      question: "   ",
      answerMode: "lines",
      answerLines: 2,
    };
    const exam = createTestExam([createTestSection([question])]);

    const issues = issuesWithCode(exam, ExamValidationCode.QUESTION_EMPTY);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("warning");
  });

  it("returns an error when the exam title is blank", () => {
    const exam = createTestExam([], { title: "  " });
    const issues = issuesWithCode(exam, ExamValidationCode.EXAM_TITLE_REQUIRED);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("error");
  });

  it("reports invalid editable structural states with stable codes", () => {
    const exam = createTestExam([
      createTestSection([
        {
          id: "question-lines-missing",
          type: "question",
          startsNewQuestion: true,
          order: 0,
          question: "Explain",
          answerMode: "lines",
        },
        {
          id: "definition-empty",
          type: "definition",
          startsNewQuestion: true,
          order: 1,
          items: [],
        },
        {
          id: "multiple-choice-empty",
          type: "multiple-choice",
          startsNewQuestion: true,
          order: 2,
          question: "Choose",
          options: [],
        },
        {
          id: "table-empty",
          type: "table",
          startsNewQuestion: true,
          order: 3,
          columns: [],
          rows: [],
          showHeader: true,
        },
      ]),
    ]);
    const codes = validateExam(exam).map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        ExamValidationCode.QUESTION_ANSWER_LINES_REQUIRED,
        ExamValidationCode.DEFINITION_ITEMS_REQUIRED,
        ExamValidationCode.MULTIPLE_CHOICE_OPTIONS_REQUIRED,
        ExamValidationCode.TABLE_COLUMNS_REQUIRED,
      ]),
    );
  });

  it("warns rather than errors when calculated and declared totals differ", () => {
    const exam = createTestExam(
      [
        createTestSection([
          {
            ...allBlockExamples[0]!,
            points: 18,
          },
        ]),
      ],
      { totalPoints: 20 },
    );
    const issues = issuesWithCode(
      exam,
      ExamValidationCode.TOTAL_POINTS_MISMATCH,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("warning");
    expect(
      validateExam(exam).filter((issue) => issue.severity === "error"),
    ).toHaveLength(0);
  });
});
