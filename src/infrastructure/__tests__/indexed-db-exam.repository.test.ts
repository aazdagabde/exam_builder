// @vitest-environment node

import "fake-indexeddb/auto";
import Dexie from "dexie";

import {
  CURRENT_EXAM_SCHEMA_VERSION,
  ExamMigrationError,
  type Exam,
} from "@/domain/exam";
import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import {
  ExamPersistenceValidationError,
  IndexedDbExamRepository,
  migratePersistedExamsToLatest,
} from "@/infrastructure/repositories/indexed-db-exam.repository";
import {
  createComplexBlocks,
  createPersistableExam,
} from "@/infrastructure/__tests__/persistence.fixtures";

let databaseCounter = 0;
let database: ExamBuilderDatabase;
let repository: IndexedDbExamRepository;

function createTestDatabase(): ExamBuilderDatabase {
  databaseCounter += 1;
  return new ExamBuilderDatabase(
    `exam-builder-repository-test-${databaseCounter}`,
  );
}

function toPreviousExam(exam: Exam): Record<string, unknown> {
  const previous = structuredClone(exam) as unknown as {
    schemaVersion: number;
    settings: { questionNumbering?: unknown };
    sections: Array<{ blocks: Array<{ startsNewQuestion?: boolean }> }>;
    [key: string]: unknown;
  };
  previous.schemaVersion = 1;
  delete previous.settings.questionNumbering;
  for (const section of previous.sections) {
    for (const block of section.blocks) delete block.startsNewQuestion;
  }
  return previous;
}

beforeEach(() => {
  database = createTestDatabase();
  repository = new IndexedDbExamRepository(database);
});

afterEach(async () => {
  database.close();
  await Dexie.delete(database.name);
});

describe("IndexedDbExamRepository", () => {
  it("saves and restores the same Exam", async () => {
    const exam = createPersistableExam("exam-save");

    await repository.save(exam);

    await expect(repository.findById(exam.id)).resolves.toEqual(exam);
  });

  it("returns null for an unknown ID", async () => {
    await expect(repository.findById("unknown")).resolves.toBeNull();
  });

  it("updates an existing record with put semantics", async () => {
    const firstVersion = createPersistableExam("exam-update", {
      title: "Version 1",
    });
    const secondVersion: Exam = {
      ...firstVersion,
      metadata: { ...firstVersion.metadata, title: "Version 2" },
      updatedAt: "2026-08-22T12:00:00.000Z",
    };

    await repository.save(firstVersion);
    await repository.save(secondVersion);

    await expect(repository.findById(firstVersion.id)).resolves.toEqual(
      secondVersion,
    );
    await expect(database.exams.count()).resolves.toBe(1);
  });

  it("deletes an existing Exam", async () => {
    const exam = createPersistableExam("exam-delete");
    await repository.save(exam);

    await repository.delete(exam.id);

    await expect(repository.findById(exam.id)).resolves.toBeNull();
  });

  it("deletes an unknown ID without error", async () => {
    await expect(repository.delete("unknown")).resolves.toBeUndefined();
  });

  it("returns all Exams ordered by updatedAt descending", async () => {
    const oldest = createPersistableExam("exam-oldest", {
      updatedAt: "2026-08-20T10:00:00.000Z",
    });
    const newest = createPersistableExam("exam-newest", {
      updatedAt: "2026-08-22T10:00:00.000Z",
    });
    const middle = createPersistableExam("exam-middle", {
      updatedAt: "2026-08-21T10:00:00.000Z",
    });

    await repository.save(oldest);
    await repository.save(newest);
    await repository.save(middle);

    await expect(repository.findAll()).resolves.toEqual([
      newest,
      middle,
      oldest,
    ]);
  });

  it("keeps separate database instances isolated", async () => {
    const otherDatabase = createTestDatabase();
    const otherRepository = new IndexedDbExamRepository(otherDatabase);
    const exam = createPersistableExam("exam-isolated");

    try {
      await repository.save(exam);

      await expect(repository.findById(exam.id)).resolves.toEqual(exam);
      await expect(otherRepository.findById(exam.id)).resolves.toBeNull();
    } finally {
      otherDatabase.close();
      await Dexie.delete(otherDatabase.name);
    }
  });

  it("rejects a future external record without deleting it", async () => {
    const corruptedRecord: unknown = {
      id: "exam-corrupted",
      schemaVersion: 999,
      updatedAt: "invalid",
    };
    await database.table<unknown, string>("exams").put(corruptedRecord);

    await expect(repository.findById("exam-corrupted")).rejects.toMatchObject({
      name: "ExamMigrationError",
      code: "UNSUPPORTED_FUTURE_EXAM_SCHEMA",
      sourceVersion: 999,
    });
    await expect(
      database.table("exams").get("exam-corrupted"),
    ).resolves.toBeDefined();
  });

  it("validates records before writing them", async () => {
    const invalidExternalValue: unknown = {
      ...createPersistableExam("exam-invalid-save"),
      schemaVersion: 999,
    };

    await expect(
      repository.save(invalidExternalValue as Exam),
    ).rejects.toBeInstanceOf(ExamPersistenceValidationError);
    await expect(database.exams.count()).resolves.toBe(0);
  });

  it("preserves a complex Exam through an IndexedDB round-trip", async () => {
    const exam = createPersistableExam("exam-complex", {
      documentLanguage: "ar",
      blocks: createComplexBlocks(),
    });

    await repository.save(exam);

    await expect(repository.findById(exam.id)).resolves.toEqual(exam);
  });

  it("preserves Arabic content and document language", async () => {
    const exam = createPersistableExam("exam-arabic", {
      title: "فرض محروس رقم 1",
      documentLanguage: "ar",
      blocks: [
        {
          id: "question-arabic",
          type: "question",
          startsNewQuestion: true,
          order: 0,
          question: "اشرح أسباب ظهور الحركة الوطنية",
          answerMode: "box",
        },
      ],
    });

    await repository.save(exam);
    const restored = await repository.findById(exam.id);

    expect(restored?.settings.documentLanguage).toBe("ar");
    expect(restored?.metadata.title).toBe("فرض محروس رقم 1");
    expect(restored?.sections[0]?.blocks[0]).toMatchObject({
      question: "اشرح أسباب ظهور الحركة الوطنية",
    });
  });

  it("does not mutate the object passed to save", async () => {
    const exam = createPersistableExam("exam-no-mutation", {
      blocks: createComplexBlocks(),
    });
    const snapshot = structuredClone(exam);

    await repository.save(exam);

    expect(exam).toEqual(snapshot);
  });

  it("returns detached plain objects rather than mutable database state", async () => {
    const exam = createPersistableExam("exam-detached");
    await repository.save(exam);

    const firstRead = await repository.findById(exam.id);
    expect(firstRead).not.toBeNull();
    if (firstRead === null) {
      throw new Error("Expected a persisted Exam.");
    }
    firstRead.metadata.title = "Changed outside the repository";

    const secondRead = await repository.findById(exam.id);
    expect(secondRead?.metadata.title).toBe(exam.metadata.title);
  });

  it("uses an identifiable error type for invalid records", async () => {
    await database
      .table<unknown, string>("exams")
      .put({ id: "invalid-record" });

    await expect(repository.findAll()).rejects.toBeInstanceOf(
      ExamPersistenceValidationError,
    );
  });

  it("migrates and rewrites a v1 record when it is read by ID", async () => {
    const current = createPersistableExam("exam-previous", {
      blocks: createComplexBlocks(),
    });
    const previous = toPreviousExam(current);
    await database.table<unknown, string>("exams").put(previous);

    const restored = await repository.findById(current.id);
    const persisted = await database
      .table<Record<string, unknown>, string>("exams")
      .get(current.id);

    expect(restored).toEqual(current);
    expect(persisted?.schemaVersion).toBe(CURRENT_EXAM_SCHEMA_VERSION);
    expect(persisted?.createdAt).toBe(current.createdAt);
    expect(persisted?.updatedAt).toBe(current.updatedAt);
  });

  it("migrates mixed v1/v2 records during findAll", async () => {
    const previous = createPersistableExam("exam-list-v1", {
      updatedAt: "2026-08-20T10:00:00.000Z",
      blocks: createComplexBlocks(),
    });
    const current = createPersistableExam("exam-list-v2", {
      updatedAt: "2026-08-21T10:00:00.000Z",
    });
    await database
      .table<unknown, string>("exams")
      .bulkPut([toPreviousExam(previous), current]);

    await expect(repository.findAll()).resolves.toEqual([current, previous]);
    await expect(
      database.table<Record<string, unknown>, string>("exams").get(previous.id),
    ).resolves.toMatchObject({
      schemaVersion: CURRENT_EXAM_SCHEMA_VERSION,
    });
  });

  it("migrates records independently and reports corrupt ones at startup", async () => {
    const previous = createPersistableExam("exam-bootstrap-v1", {
      blocks: createComplexBlocks(),
    });
    const current = createPersistableExam("exam-bootstrap-v2");
    const currentSnapshot = structuredClone(current);
    const future = { id: "exam-bootstrap-future", schemaVersion: 999 };
    await database
      .table<unknown, string>("exams")
      .bulkPut([toPreviousExam(previous), current, future]);

    const report = await migratePersistedExamsToLatest(database);

    expect(report.migratedIds).toEqual([previous.id]);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0]).toMatchObject({
      recordId: future.id,
      error: expect.objectContaining<Partial<ExamMigrationError>>({
        code: "UNSUPPORTED_FUTURE_EXAM_SCHEMA",
      }),
    });
    await expect(repository.findById(previous.id)).resolves.toEqual(previous);
    await expect(repository.findById(current.id)).resolves.toEqual(
      currentSnapshot,
    );
    await expect(database.table("exams").get(future.id)).resolves.toBeDefined();
  });
});
