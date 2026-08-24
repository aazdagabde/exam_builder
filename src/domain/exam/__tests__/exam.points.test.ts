// @vitest-environment node

import {
  calculateBlockPoints,
  calculateExamPoints,
  calculateSectionPoints,
  type DefinitionBlock,
  type ExamBlock,
} from "@/domain/exam";
import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";

describe("Exam point calculations", () => {
  it("totals points from four scored blocks without counting declarations", () => {
    const blocks: ExamBlock[] = [
      { ...allBlockExamples[3]!, points: 2 },
      { ...allBlockExamples[5]!, points: 3 },
      { ...allBlockExamples[10]!, points: 7 },
      { ...allBlockExamples[8]!, points: 1 },
    ];
    const exam = createTestExam([createTestSection(blocks, { points: 99 })], {
      totalPoints: 20,
    });

    expect(calculateExamPoints(exam)).toBe(13);
  });

  it("adds decimal points without floating-point noise", () => {
    const blocks: ExamBlock[] = [
      { ...allBlockExamples[0]!, id: "decimal-1", points: 0.5 },
      { ...allBlockExamples[0]!, id: "decimal-2", points: 1.5 },
      { ...allBlockExamples[0]!, id: "decimal-3", points: 2 },
    ];

    expect(
      calculateExamPoints(createTestExam([createTestSection(blocks)])),
    ).toBe(4);
  });

  it("sums Definition items only when the block has no explicit points", () => {
    const definition: DefinitionBlock = {
      id: "definition-points",
      type: "definition",
      startsNewQuestion: true,
      order: 0,
      items: [
        { id: "definition-a", term: "A", answerLines: 1, points: 0.5 },
        { id: "definition-b", term: "B", answerLines: 1, points: 1.5 },
      ],
    };

    expect(calculateBlockPoints(definition)).toBe(2);
    expect(calculateBlockPoints({ ...definition, points: 3 })).toBe(3);
  });

  it("does not add section.points or metadata.totalPoints", () => {
    const block: ExamBlock = { ...allBlockExamples[0]!, points: 2 };
    const section = createTestSection([block], { points: 10 });
    const exam = createTestExam([section], { totalPoints: 20 });

    expect(calculateSectionPoints(section)).toBe(2);
    expect(calculateExamPoints(exam)).toBe(2);
  });
});
