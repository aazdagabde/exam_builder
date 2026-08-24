// @vitest-environment node

import {
  computeQuestionNumbering,
  createEmptyExam,
  createExamBlock,
  duplicateBlock,
  duplicateSection,
  type Exam,
  type ExamBlock,
} from "@/domain/exam";

const now = "2026-01-01T00:00:00.000Z";

function block(
  id: string,
  startsNewQuestion: boolean,
  type: "question" | "definition" = "question",
): ExamBlock {
  const created = createExamBlock({
    type,
    id,
    order: 0,
    createInternalId: (kind) => `${id}-${kind}`,
  });
  if (created.type !== "question" && created.type !== "definition") {
    throw new Error("Unexpected block type in numbering fixture.");
  }
  return {
    ...created,
    startsNewQuestion,
  };
}

function examWithSections(blocks: ExamBlock[][]): Exam {
  const exam = createEmptyExam({
    id: "exam",
    now,
    documentLanguage: "ar",
  });
  return {
    ...exam,
    sections: blocks.map((sectionBlocks, index) => ({
      id: `section-${index}`,
      title: `Section ${index}`,
      blocks: sectionBlocks.map((item, order) => ({ ...item, order })),
    })),
  };
}

describe("computeQuestionNumbering", () => {
  it("returns no number when disabled", () => {
    const exam = examWithSections([[block("a", true)]]);
    exam.settings.questionNumbering = {
      enabled: false,
      restartPerSection: true,
    };
    expect([...computeQuestionNumbering(exam)]).toEqual([]);
  });

  it("numbers only marked blocks and restarts in each section", () => {
    const exam = examWithSections([
      [
        block("a", true),
        block("linked", false),
        block("b", true, "definition"),
      ],
      [block("c", true)],
    ]);

    expect([...computeQuestionNumbering(exam)]).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 1],
    ]);
  });

  it("supports continuous numbering", () => {
    const exam = examWithSections([[block("a", true)], [block("b", true)]]);
    exam.settings.questionNumbering = {
      enabled: true,
      restartPerSection: false,
    };
    expect([...computeQuestionNumbering(exam)]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("recalculates after move and delete without mutating blocks", () => {
    const a = block("a", true);
    const b = block("b", true);
    const c = block("c", true);
    const exam = examWithSections([[c, a, b]]);
    expect([...computeQuestionNumbering(exam)]).toEqual([
      ["c", 1],
      ["a", 2],
      ["b", 3],
    ]);

    const deleted = {
      ...exam,
      sections: [{ ...exam.sections[0]!, blocks: [c, b] }],
    };
    expect([...computeQuestionNumbering(deleted)]).toEqual([
      ["c", 1],
      ["b", 2],
    ]);
    expect(a.order).toBe(0);
  });

  it("preserves the intention through block and section duplication", () => {
    const source = block("source", true);
    const copy = duplicateBlock(source, {
      id: "copy",
      createInternalId: ({ kind }) => `copy-${kind}`,
    });
    expect(copy.startsNewQuestion).toBe(true);

    const sectionCopy = duplicateSection(
      { id: "section", title: "Title", blocks: [source] },
      { id: "section-copy", createInternalId: ({ kind }) => `section-${kind}` },
    );
    expect(sectionCopy.blocks[0]?.startsNewQuestion).toBe(true);
  });
});
