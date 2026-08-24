// @vitest-environment node

import "fake-indexeddb/auto";
import Dexie from "dexie";

import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import { createPersistableExam } from "@/infrastructure/__tests__/persistence.fixtures";

let databaseCounter = 0;

describe("Exam Builder database migration", () => {
  it("adds assets without losing version 1 exams and preferences", async () => {
    const name = `database-migration-${++databaseCounter}`;
    const legacy = new Dexie(name);
    legacy.version(1).stores({ exams: "id, updatedAt", preferences: "id" });
    await legacy.open();
    const exam = createPersistableExam("legacy-exam");
    await legacy.table("exams").put(exam);
    await legacy.table("preferences").put({
      id: "user-preferences",
      preferences: { interfaceLanguage: "ar" },
    });
    legacy.close();

    const current = new ExamBuilderDatabase(name);
    try {
      await current.open();
      await expect(current.exams.get(exam.id)).resolves.toEqual(exam);
      await expect(
        current.preferences.get("user-preferences"),
      ).resolves.toEqual({
        id: "user-preferences",
        preferences: { interfaceLanguage: "ar" },
      });
      await expect(current.assets.count()).resolves.toBe(0);
      expect(current.tables.map((table) => table.name)).toContain("assets");
    } finally {
      current.close();
      await Dexie.delete(name);
    }
  });
});
