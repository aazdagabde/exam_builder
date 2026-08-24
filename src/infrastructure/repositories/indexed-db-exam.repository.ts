import {
  CURRENT_EXAM_SCHEMA_VERSION,
  detectExamSchemaVersion,
  ExamMigrationError,
  ExamSchema,
  migrateExamToLatest,
  type Exam,
  type ExamId,
} from "@/domain/exam";
import type { ExamRepository } from "@/domain/repositories/exam-repository";
import type { ExamBuilderDatabase } from "@/infrastructure/indexed-db/database";

export class ExamPersistenceValidationError extends Error {
  readonly recordId?: string;

  constructor(recordId: string | undefined, cause: unknown) {
    super(
      recordId
        ? `Persisted Exam "${recordId}" failed validation.`
        : "An Exam failed validation at the persistence boundary.",
      { cause },
    );
    this.name = "ExamPersistenceValidationError";
    this.recordId = recordId;
  }
}

function readPossibleRecordId(record: unknown): string | undefined {
  if (
    typeof record === "object" &&
    record !== null &&
    "id" in record &&
    typeof record.id === "string"
  ) {
    return record.id;
  }

  return undefined;
}

function parseExamRecord(record: unknown, fallbackId?: string): Exam {
  try {
    return migrateExamToLatest(record);
  } catch (cause: unknown) {
    if (
      cause instanceof ExamMigrationError &&
      cause.code === "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
    ) {
      throw cause;
    }
    throw new ExamPersistenceValidationError(
      readPossibleRecordId(record) ?? fallbackId,
      cause,
    );
  }
}

async function migrateAndPersistRecord(
  database: ExamBuilderDatabase,
  record: unknown,
  fallbackId?: string,
): Promise<Exam> {
  let sourceVersion: number;
  try {
    sourceVersion = detectExamSchemaVersion(record);
  } catch (cause: unknown) {
    if (
      cause instanceof ExamMigrationError &&
      cause.code === "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
    ) {
      throw cause;
    }
    throw new ExamPersistenceValidationError(
      readPossibleRecordId(record) ?? fallbackId,
      cause,
    );
  }

  const exam = parseExamRecord(record, fallbackId);
  if (sourceVersion !== CURRENT_EXAM_SCHEMA_VERSION) {
    await database.exams.put(exam);
  }
  return exam;
}

export interface PersistedExamMigrationFailure {
  recordId?: string;
  error: unknown;
}

export interface PersistedExamsMigrationReport {
  migratedIds: string[];
  failures: PersistedExamMigrationFailure[];
}

/** Migrates each record independently; corrupt records are never deleted. */
export async function migratePersistedExamsToLatest(
  database: ExamBuilderDatabase,
): Promise<PersistedExamsMigrationReport> {
  const records: unknown[] = await database.exams.toArray();
  const report: PersistedExamsMigrationReport = {
    migratedIds: [],
    failures: [],
  };

  for (const record of records) {
    const recordId = readPossibleRecordId(record);
    try {
      const sourceVersion = detectExamSchemaVersion(record);
      await migrateAndPersistRecord(database, record, recordId);
      if (sourceVersion !== CURRENT_EXAM_SCHEMA_VERSION && recordId) {
        report.migratedIds.push(recordId);
      }
    } catch (error: unknown) {
      report.failures.push({ recordId, error });
    }
  }

  return report;
}

export class IndexedDbExamRepository implements ExamRepository {
  constructor(private readonly database: ExamBuilderDatabase) {}

  async findAll(): Promise<Exam[]> {
    const records: unknown[] = await this.database.exams.toArray();
    const exams: Exam[] = [];
    for (const record of records) {
      exams.push(await migrateAndPersistRecord(this.database, record));
    }

    return exams.sort(
      (first, second) =>
        Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
    );
  }

  async findById(id: ExamId): Promise<Exam | null> {
    const record: unknown = await this.database.exams.get(id);

    if (record === undefined) {
      return null;
    }

    return migrateAndPersistRecord(this.database, record, id);
  }

  async save(exam: Exam): Promise<void> {
    let validatedExam: Exam;
    try {
      validatedExam = ExamSchema.parse(exam);
    } catch (cause: unknown) {
      throw new ExamPersistenceValidationError(exam.id, cause);
    }
    await this.database.exams.put(validatedExam);
  }

  async delete(id: ExamId): Promise<void> {
    await this.database.exams.delete(id);
  }
}
