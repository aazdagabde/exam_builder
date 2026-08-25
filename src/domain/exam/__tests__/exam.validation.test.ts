// @vitest-environment node

import {
  ExamBlockSchema,
  ExamValidationCode,
  validateExam,
  type ExamBlock,
  type QuestionBlock,
  type TimelineBlock,
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

  it("reports advanced Timeline editing problems as non-blocking warnings", () => {
    const timeline: TimelineBlock = {
      id: "timeline",
      type: "timeline",
      order: 0,
      startsNewQuestion: true,
      title: "Dense timeline",
      orientation: "horizontal",
      showDates: true,
      timelineStyle: "historical",
      spacingMode: "scaled",
      chronologyDirection: "ltr",
      scale: { start: 0, end: 100, step: 1, unitLabel: "" },
      scaleCaption: "",
      periods: [
        { id: "period", startValue: -1, endValue: 50, label: "Outside" },
      ],
      events: [
        {
          id: "missing",
          date: "?",
          axisValue: null,
          label: "Missing",
          description: "",
        },
        {
          id: "outside",
          date: "101",
          axisValue: 101,
          label: "Outside",
          description: "",
        },
        ...[50, 50.1, 50.2, 50.3, 50.4].map((axisValue, index) => ({
          id: `dense-${index}`,
          date: String(axisValue),
          axisValue,
          label: `Dense ${index}`,
          description: "",
        })),
      ],
    };
    const issues = validateExam(
      createTestExam([createTestSection([timeline])]),
    );
    const codes = issues.map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        ExamValidationCode.TIMELINE_EVENT_POSITION_MISSING,
        ExamValidationCode.TIMELINE_EVENT_OUT_OF_RANGE,
        ExamValidationCode.TIMELINE_TOO_MANY_TICKS,
        ExamValidationCode.TIMELINE_HORIZONTAL_TOO_DENSE,
        ExamValidationCode.TIMELINE_PERIOD_OUT_OF_RANGE,
      ]),
    );
    expect(
      issues
        .filter((issue) => String(issue.code).startsWith("TIMELINE_"))
        .every((issue) => issue.severity === "warning"),
    ).toBe(true);
  });

  it("warns when scaled mode temporarily has no scale", () => {
    const source = allBlockExamples.find((block) => block.type === "timeline")!;
    if (source.type !== "timeline") throw new Error("fixture mismatch");
    const timeline: TimelineBlock = {
      ...source,
      spacingMode: "scaled",
      scale: null,
    };
    expect(
      issuesWithCode(
        createTestExam([createTestSection([timeline])]),
        ExamValidationCode.TIMELINE_SCALE_INVALID,
      ),
    ).toHaveLength(1);

    const zeroStep: TimelineBlock = {
      ...source,
      spacingMode: "scaled",
      scale: { start: 1912, end: 1956, step: 0, unitLabel: "" },
    };
    expect(ExamBlockSchema.safeParse(zeroStep).success).toBe(true);
    expect(
      issuesWithCode(
        createTestExam([createTestSection([zeroStep])]),
        ExamValidationCode.TIMELINE_SCALE_INVALID,
      ),
    ).toHaveLength(1);
  });
});
