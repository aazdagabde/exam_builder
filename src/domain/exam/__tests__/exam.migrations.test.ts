// @vitest-environment node

import {
  computeQuestionNumbering,
  CURRENT_EXAM_SCHEMA_VERSION,
  EXAM_SCHEMA_VERSION_2,
  EXAM_SCHEMA_VERSION_3,
  ExamMigrationError,
  migrateExamToLatest,
} from "@/domain/exam";
import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";

type PreviousExamInput = {
  schemaVersion?: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, unknown>;
  sections: Array<{
    id: string;
    title: string;
    blocks: Array<Record<string, unknown>>;
  }>;
  [key: string]: unknown;
};

function asPreviousExam(input = createTestExam()): PreviousExamInput {
  const previous = structuredClone(input) as unknown as PreviousExamInput;
  previous.schemaVersion = 1;
  return previous;
}

function fixture(type: string) {
  const block = allBlockExamples.find((candidate) => candidate.type === type);
  if (!block) throw new Error(`Missing ${type} test fixture.`);
  return structuredClone(block) as unknown as Record<string, unknown>;
}

describe("Exam persistent schema migrations", () => {
  it("migrates v1 to v2 with current defaults while preserving identity", () => {
    const source = asPreviousExam(
      createTestExam([
        createTestSection([
          allBlockExamples[1]!,
          allBlockExamples[3]!,
          allBlockExamples[12]!,
          allBlockExamples[13]!,
        ]),
      ]),
    );
    delete source.settings.questionNumbering;
    for (const block of source.sections[0]!.blocks) {
      delete block.startsNewQuestion;
    }

    const migrated = migrateExamToLatest(source);

    expect(migrated.schemaVersion).toBe(CURRENT_EXAM_SCHEMA_VERSION);
    expect(migrated.settings.questionNumbering).toEqual({
      enabled: true,
      restartPerSection: true,
    });
    expect(
      migrated.sections[0]!.blocks.map((block) => [
        block.type,
        block.startsNewQuestion,
      ]),
    ).toEqual([
      ["text-document", false],
      ["question", true],
      ["separator", false],
      ["page-break", false],
    ]);
    expect(migrated.id).toBe(source.id);
    expect(migrated.sections[0]!.id).toBe(source.sections[0]!.id);
    expect(migrated.sections[0]!.blocks.map((block) => block.id)).toEqual(
      source.sections[0]!.blocks.map((block) => block.id),
    );
    expect(migrated.createdAt).toBe(source.createdAt);
    expect(migrated.updatedAt).toBe(source.updatedAt);
    expect(source.schemaVersion).toBe(1);
    expect(source.sections[0]!.blocks[0]).not.toHaveProperty(
      "startsNewQuestion",
    );
  });

  it("migrates a v2 Exam with 14 blocks to v3 without inventing blocks", () => {
    const current = createTestExam([
      createTestSection(allBlockExamples.slice(0, 14)),
    ]);
    const source = {
      ...structuredClone(current),
      schemaVersion: EXAM_SCHEMA_VERSION_2,
    };
    const beforeBlocks = structuredClone(source.sections[0]!.blocks);

    const migrated = migrateExamToLatest(source);

    expect(migrated.schemaVersion).toBe(CURRENT_EXAM_SCHEMA_VERSION);
    expect(migrated.sections[0]!.blocks).toHaveLength(14);
    expect(migrated.sections[0]!.blocks).toEqual(beforeBlocks);
    expect(migrated.id).toBe(source.id);
    expect(migrated.createdAt).toBe(source.createdAt);
    expect(migrated.updatedAt).toBe(source.updatedAt);
    expect(source.schemaVersion).toBe(EXAM_SCHEMA_VERSION_2);
  });

  it("chains v1 through v2 to v3", () => {
    const source = asPreviousExam(
      createTestExam([createTestSection(allBlockExamples.slice(0, 14))]),
    );
    delete source.settings.questionNumbering;
    source.sections[0]!.blocks.forEach((block) => {
      delete block.startsNewQuestion;
    });

    const migrated = migrateExamToLatest(source);

    expect(migrated.schemaVersion).toBe(CURRENT_EXAM_SCHEMA_VERSION);
    expect(migrated.sections[0]!.blocks).toHaveLength(14);
    expect(migrated.sections[0]!.blocks.map((block) => block.id)).toEqual(
      source.sections[0]!.blocks.map((block) => block.id),
    );
  });

  it.each([
    ["ar", "rtl"],
    ["fr", "ltr"],
  ] as const)(
    "migrates a %s v3 Timeline to a simple sequence v4 Timeline",
    (documentLanguage, chronologyDirection) => {
      const current = createTestExam([
        createTestSection([
          allBlockExamples.find((block) => block.type === "timeline")!,
        ]),
      ]);
      current.settings.documentLanguage = documentLanguage;
      const source = structuredClone(current) as unknown as PreviousExamInput;
      source.schemaVersion = EXAM_SCHEMA_VERSION_3;
      const timeline = source.sections[0]!.blocks[0]!;
      delete timeline.timelineStyle;
      delete timeline.spacingMode;
      delete timeline.chronologyDirection;
      delete timeline.scale;
      delete timeline.periods;
      delete timeline.scaleCaption;
      const events = timeline.events as Array<Record<string, unknown>>;
      events.forEach((event) => delete event.axisValue);

      const migrated = migrateExamToLatest(source);
      const block = migrated.sections[0]!.blocks[0]!;
      expect(block.type).toBe("timeline");
      if (block.type !== "timeline") throw new Error("fixture mismatch");
      expect(block).toMatchObject({
        timelineStyle: "simple",
        spacingMode: "sequence",
        chronologyDirection,
        scale: null,
        periods: [],
        scaleCaption: "",
      });
      expect(block.events.every((event) => event.axisValue === null)).toBe(
        true,
      );
    },
  );

  it("preserves explicit v1 numbering choices and image references", () => {
    const source = asPreviousExam(
      createTestExam([
        createTestSection([
          allBlockExamples[2]!,
          allBlockExamples[3]!,
          allBlockExamples[11]!,
        ]),
      ]),
    );
    source.settings.questionNumbering = {
      enabled: false,
      restartPerSection: false,
    };
    source.sections[0]!.blocks[0]!.startsNewQuestion = false;
    source.sections[0]!.blocks[1]!.startsNewQuestion = false;
    source.sections[0]!.blocks[2]!.startsNewQuestion = true;

    const migrated = migrateExamToLatest(source);

    expect(migrated.settings.questionNumbering).toEqual({
      enabled: false,
      restartPerSection: false,
    });
    expect(migrated.sections[0]!.blocks[1]!.startsNewQuestion).toBe(false);
    expect(migrated.sections[0]!.blocks[2]!.startsNewQuestion).toBe(true);
    expect(migrated.sections[0]!.blocks[0]).toMatchObject({
      type: "image",
      imageId: "resource-1",
    });
  });

  it("reconstructs representative v1 numbering deterministically", () => {
    const blocks = [
      fixture("text-document"),
      fixture("question"),
      { ...fixture("question"), id: "question-2" },
      fixture("definition"),
      fixture("true-false"),
      fixture("table"),
    ];
    blocks.forEach((block, order) => {
      block.order = order;
      delete block.startsNewQuestion;
    });
    const source = asPreviousExam();
    delete source.settings.questionNumbering;
    source.sections = [{ id: "section-reference", title: "Reference", blocks }];

    const migrated = migrateExamToLatest(source);

    expect([...computeQuestionNumbering(migrated).entries()]).toEqual([
      ["question-1", 1],
      ["question-2", 2],
      ["definition-1", 3],
      ["true-false-1", 4],
      ["table-1", 5],
    ]);
  });

  it("reconstructs the observed Arabic legacy questions in display order", () => {
    const prompts = ["حدد(ي)", "اشرح(ي)", "ضع(ي)", "استخرج(ي)"];
    const blocks = prompts.map((question, order) => ({
      ...fixture("question"),
      id: `observed-question-${order + 1}`,
      order,
      question,
    }));
    for (const block of blocks) {
      Reflect.deleteProperty(block, "startsNewQuestion");
    }

    const source = asPreviousExam();
    delete source.settings.questionNumbering;
    source.sections = [{ id: "observed-section", title: "", blocks }];

    const migrated = migrateExamToLatest(source);
    const numbering = computeQuestionNumbering(migrated);

    expect(numbering.size).toBe(4);
    expect(
      migrated.sections[0]!.blocks.map((block) => ({
        text: block.type === "question" ? block.question : "",
        label: `${numbering.get(block.id)}-`,
        startsNewQuestion: block.startsNewQuestion,
      })),
    ).toEqual([
      { text: "حدد(ي)", label: "1-", startsNewQuestion: true },
      { text: "اشرح(ي)", label: "2-", startsNewQuestion: true },
      { text: "ضع(ي)", label: "3-", startsNewQuestion: true },
      { text: "استخرج(ي)", label: "4-", startsNewQuestion: true },
    ]);
  });

  it("is idempotent for an already-current Exam", () => {
    const current = createTestExam([createTestSection([allBlockExamples[3]!])]);

    expect(migrateExamToLatest(migrateExamToLatest(current))).toEqual(current);
  });

  it("treats a missing version only as v1 migration input", () => {
    const source = asPreviousExam();
    delete source.schemaVersion;

    expect(migrateExamToLatest(source).schemaVersion).toBe(
      CURRENT_EXAM_SCHEMA_VERSION,
    );
  });

  it("rejects future schema versions with a structured error", () => {
    expect(() => migrateExamToLatest({ schemaVersion: 999 })).toThrowError(
      expect.objectContaining<Partial<ExamMigrationError>>({
        code: "UNSUPPORTED_FUTURE_EXAM_SCHEMA",
        sourceVersion: 999,
      }),
    );
  });

  it.each([0, -1, 1.5, "2"])(
    "rejects invalid schema version %s explicitly",
    (schemaVersion) => {
      expect(() => migrateExamToLatest({ schemaVersion })).toThrowError(
        expect.objectContaining<Partial<ExamMigrationError>>({
          code: "UNSUPPORTED_EXAM_SCHEMA",
        }),
      );
    },
  );

  it("rejects an invalid current record instead of applying defaults", () => {
    const current = createTestExam([
      createTestSection([allBlockExamples[3]!]),
    ]) as unknown as PreviousExamInput;
    delete current.settings.questionNumbering;

    expect(() => migrateExamToLatest(current)).toThrowError(
      expect.objectContaining<Partial<ExamMigrationError>>({
        code: "EXAM_MIGRATION_FAILED",
        sourceVersion: CURRENT_EXAM_SCHEMA_VERSION,
      }),
    );
  });
});
