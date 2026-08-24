// @vitest-environment node

import {
  duplicateExam,
  duplicateSection,
  ExamSchema,
  type DuplicateIdContext,
  type Exam,
} from "@/domain/exam";
import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";

function createCopiedId({ kind, sourceId }: DuplicateIdContext): string {
  return `copy:${kind}:${sourceId}`;
}

function collectInternalIds(exam: Exam): string[] {
  const ids: string[] = [];

  for (const section of exam.sections) {
    ids.push(section.id);

    for (const block of section.blocks) {
      ids.push(block.id);

      switch (block.type) {
        case "definition":
          ids.push(...block.items.map((item) => item.id));
          break;
        case "true-false":
          ids.push(...block.statements.map((statement) => statement.id));
          break;
        case "multiple-choice":
          ids.push(...block.options.map((option) => option.id));
          break;
        case "fill-blank":
          ids.push(
            ...block.segments
              .filter((segment) => segment.type === "blank")
              .map((segment) => segment.id),
          );
          break;
        case "table":
          ids.push(...block.columns.map((column) => column.id));
          ids.push(...block.rows.map((row) => row.id));
          break;
        case "matching":
          ids.push(...block.leftItems.map((item) => item.id));
          ids.push(...block.rightItems.map((item) => item.id));
          break;
        case "essay":
          ids.push(...block.topics.map((topic) => topic.id));
          break;
      }
    }
  }

  return ids;
}

describe("duplicateExam", () => {
  it("creates an independent, structurally valid Exam copy", () => {
    const source = createTestExam([createTestSection(allBlockExamples)], {
      title: "Original exam",
      totalPoints: 20,
    });
    const sourceSnapshot = structuredClone(source);
    const now = "2026-08-23T09:30:00.000Z";

    const duplicate = duplicateExam(source, {
      id: "exam-copy",
      now,
      createInternalId: createCopiedId,
    });

    expect(ExamSchema.parse(duplicate)).toEqual(duplicate);
    expect(duplicate.id).toBe("exam-copy");
    expect(duplicate.schemaVersion).toBe(source.schemaVersion);
    expect(duplicate.createdAt).toBe(now);
    expect(duplicate.updatedAt).toBe(now);
    expect(duplicate.metadata).toEqual(source.metadata);
    expect(duplicate.settings).toEqual(source.settings);
    expect(duplicate.studentFields).toEqual(source.studentFields);
    expect(duplicate.sections.map((section) => section.title)).toEqual(
      source.sections.map((section) => section.title),
    );
    expect(duplicate.sections[0]?.blocks.map((block) => block.type)).toEqual(
      source.sections[0]?.blocks.map((block) => block.type),
    );
    expect(source).toEqual(sourceSnapshot);
  });

  it("regenerates every internal persistable ID", () => {
    const source = createTestExam([createTestSection(allBlockExamples)]);
    const duplicate = duplicateExam(source, {
      id: "exam-copy-ids",
      now: "2026-08-23T09:30:00.000Z",
      createInternalId: createCopiedId,
    });
    const sourceIds = new Set(collectInternalIds(source));
    const duplicateIds = collectInternalIds(duplicate);

    expect(duplicateIds).toHaveLength(sourceIds.size);
    expect(duplicateIds.every((id) => !sourceIds.has(id))).toBe(true);
  });

  it("updates table cell references while preserving external imageId references", () => {
    const source = createTestExam([createTestSection(allBlockExamples)]);
    const duplicate = duplicateExam(source, {
      id: "exam-copy-references",
      now: "2026-08-23T09:30:00.000Z",
      createInternalId: createCopiedId,
    });
    const table = duplicate.sections[0]?.blocks.find(
      (block) => block.type === "table",
    );
    const image = duplicate.sections[0]?.blocks.find(
      (block) => block.type === "image",
    );

    expect(table?.type).toBe("table");
    if (table?.type === "table") {
      expect(table.rows[0]?.cells[0]?.columnId).toBe(table.columns[0]?.id);
    }

    expect(image?.type).toBe("image");
    if (image?.type === "image") {
      expect(image.imageId).toBe("resource-1");
    }
  });
});

describe("duplicateSection", () => {
  it("regenerates nested IDs and rewires table references without copying assets", () => {
    const source = createTestSection(allBlockExamples, {
      id: "section-source",
    });
    const duplicate = duplicateSection(source, {
      id: "section-copy",
      createInternalId: createCopiedId,
    });
    const sourceIds = new Set(collectInternalIds(createTestExam([source])));
    const duplicateIds = collectInternalIds(createTestExam([duplicate]));
    const table = duplicate.blocks.find((block) => block.type === "table");
    const image = duplicate.blocks.find((block) => block.type === "image");

    expect(duplicate.id).toBe("section-copy");
    expect(duplicateIds.every((id) => !sourceIds.has(id))).toBe(true);
    if (table?.type === "table") {
      expect(table.rows[0]?.cells[0]?.columnId).toBe(table.columns[0]?.id);
    }
    if (image?.type === "image") {
      expect(image.imageId).toBe("resource-1");
    }
  });
});
