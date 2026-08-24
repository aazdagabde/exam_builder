import { ExamSchema } from "@/domain/exam/exam.schema";
import {
  CURRENT_EXAM_SCHEMA_VERSION,
  PREVIOUS_EXAM_SCHEMA_VERSION,
  type Exam,
} from "@/domain/exam/exam.types";
import { migrateExamV1ToV2 } from "@/domain/exam/migrations/v1-to-v2";

export type ExamMigrationErrorCode =
  | "EXAM_MIGRATION_FAILED"
  | "UNSUPPORTED_EXAM_SCHEMA"
  | "UNSUPPORTED_FUTURE_EXAM_SCHEMA";

export class ExamMigrationError extends Error {
  constructor(
    public readonly code: ExamMigrationErrorCode,
    options?: { cause?: unknown; sourceVersion?: number },
  ) {
    super(
      code,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "ExamMigrationError";
    this.sourceVersion = options?.sourceVersion;
  }

  readonly sourceVersion?: number;
}

type Migration = (input: unknown) => unknown;

const migrations: ReadonlyMap<number, Migration> = new Map([
  [PREVIOUS_EXAM_SCHEMA_VERSION, migrateExamV1ToV2],
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Missing version is accepted only as schema v1 migration input. */
export function detectExamSchemaVersion(raw: unknown): number {
  if (!isRecord(raw)) {
    throw new ExamMigrationError("UNSUPPORTED_EXAM_SCHEMA");
  }

  if (!("schemaVersion" in raw)) return PREVIOUS_EXAM_SCHEMA_VERSION;

  const version = raw.schemaVersion;
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw new ExamMigrationError("UNSUPPORTED_EXAM_SCHEMA");
  }
  if (version > CURRENT_EXAM_SCHEMA_VERSION) {
    throw new ExamMigrationError("UNSUPPORTED_FUTURE_EXAM_SCHEMA", {
      sourceVersion: version,
    });
  }

  return version;
}

/** Applies explicit N→N+1 migrations, then validates the strict current schema. */
export function migrateExamToLatest(raw: unknown): Exam {
  const sourceVersion = detectExamSchemaVersion(raw);
  let version = sourceVersion;
  let migrated: unknown = raw;

  try {
    while (version < CURRENT_EXAM_SCHEMA_VERSION) {
      const migration = migrations.get(version);
      if (!migration) {
        throw new ExamMigrationError("UNSUPPORTED_EXAM_SCHEMA", {
          sourceVersion: version,
        });
      }
      migrated = migration(migrated);
      version += 1;
    }

    return ExamSchema.parse(migrated);
  } catch (cause: unknown) {
    if (cause instanceof ExamMigrationError) throw cause;
    throw new ExamMigrationError("EXAM_MIGRATION_FAILED", {
      cause,
      sourceVersion,
    });
  }
}
