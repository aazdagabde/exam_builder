// @vitest-environment node

import {
  countEssayBlocks,
  CREATABLE_EXAM_BLOCK_TYPES,
  createExamBlock,
  createImageBlock,
  ExamBlockSchema,
  normalizeBlockOrder,
} from "@/domain/exam";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";

describe("Exam block helpers", () => {
  it.each(CREATABLE_EXAM_BLOCK_TYPES)(
    "creates a schema-valid neutral %s block",
    (type) => {
      let internalId = 0;
      const block = createExamBlock({
        type,
        id: `block-${type}`,
        order: 7,
        createInternalId: (kind) => `${kind}-${++internalId}`,
      });

      expect(block.type).toBe(type);
      expect(block.order).toBe(7);
      expect(ExamBlockSchema.safeParse(block).success).toBe(true);
    },
  );

  it("never exposes Image as creatable without a real asset workflow", () => {
    expect(CREATABLE_EXAM_BLOCK_TYPES).not.toContain("image");
  });

  it("creates an ImageBlock only with an explicit asset ID", () => {
    expect(
      createImageBlock({ id: "image", order: 0, imageId: "asset-real" }),
    ).toEqual({
      id: "image",
      type: "image",
      order: 0,
      imageId: "asset-real",
      alignment: "center",
      startsNewQuestion: false,
    });
    expect(() =>
      createImageBlock({ id: "image", order: 0, imageId: "" }),
    ).toThrow();
  });

  it("normalizes order without mutating its input", () => {
    const first = createExamBlock({
      type: "question",
      id: "first",
      order: 12,
      createInternalId: () => "unused",
    });
    const second = createExamBlock({
      type: "page-break",
      id: "second",
      order: 99,
      createInternalId: () => "unused",
    });

    const normalized = normalizeBlockOrder([first, second]);

    expect(normalized.map((block) => block.order)).toEqual([0, 1]);
    expect(first.order).toBe(12);
    expect(second.order).toBe(99);
  });

  it("counts essay blocks across all sections", () => {
    const essay = createExamBlock({
      type: "essay",
      id: "essay",
      order: 0,
      createInternalId: () => "unused",
    });
    const exam = createTestExam([
      createTestSection([essay], { id: "a" }),
      createTestSection([], { id: "b" }),
    ]);

    expect(countEssayBlocks(exam)).toBe(1);
  });
});
