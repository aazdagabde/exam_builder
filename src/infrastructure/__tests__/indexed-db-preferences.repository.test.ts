// @vitest-environment node

import "fake-indexeddb/auto";
import Dexie from "dexie";

import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import { IndexedDbPreferencesRepository } from "@/infrastructure/repositories/indexed-db-preferences.repository";

let databaseCounter = 0;
let database: ExamBuilderDatabase;
let repository: IndexedDbPreferencesRepository;

beforeEach(() => {
  databaseCounter += 1;
  database = new ExamBuilderDatabase(
    `exam-builder-preferences-test-${databaseCounter}`,
  );
  repository = new IndexedDbPreferencesRepository(database);
});

afterEach(async () => {
  database.close();
  await Dexie.delete(database.name);
});

describe("IndexedDbPreferencesRepository", () => {
  it("returns null when no preferences have been saved", async () => {
    await expect(repository.get()).resolves.toBeNull();
  });

  it("saves the French interface language", async () => {
    await repository.save({ interfaceLanguage: "fr" });

    await expect(repository.get()).resolves.toEqual({
      interfaceLanguage: "fr",
    });
  });

  it("replaces French preferences with Arabic preferences", async () => {
    await repository.save({ interfaceLanguage: "fr" });
    await repository.save({ interfaceLanguage: "ar" });

    await expect(repository.get()).resolves.toEqual({
      interfaceLanguage: "ar",
    });
    await expect(database.preferences.count()).resolves.toBe(1);
  });
});
