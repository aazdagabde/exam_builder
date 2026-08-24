import Dexie, { type Table } from "dexie";

import type {
  PersistedAssetRecord,
  PersistedExamRecord,
  PersistedPreferencesRecord,
} from "@/infrastructure/indexed-db/database.types";

export const EXAM_BUILDER_DATABASE_NAME = "exam-builder";
export const EXAM_BUILDER_DATABASE_VERSION = 2;

export class ExamBuilderDatabase extends Dexie {
  exams!: Table<PersistedExamRecord, string>;
  preferences!: Table<PersistedPreferencesRecord, string>;
  assets!: Table<PersistedAssetRecord, string>;

  constructor(name = EXAM_BUILDER_DATABASE_NAME) {
    super(name);

    // Dexie versions the physical IndexedDB layout; Exam.schemaVersion versions Exam JSON.
    this.version(1).stores({
      exams: "id, updatedAt",
      preferences: "id",
    });
    this.version(EXAM_BUILDER_DATABASE_VERSION).stores({
      exams: "id, updatedAt",
      preferences: "id",
      assets: "id, createdAt, mimeType",
    });
  }
}
