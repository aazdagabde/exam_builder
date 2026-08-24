// @vitest-environment node

import "fake-indexeddb/auto";
import Dexie from "dexie";

import type { ImageAssetRecord } from "@/domain/assets";
import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import {
  AssetPersistenceValidationError,
  IndexedDbAssetRepository,
} from "@/infrastructure/repositories/indexed-db-asset.repository";

let databaseCounter = 0;
let database: ExamBuilderDatabase;
let repository: IndexedDbAssetRepository;

function asset(id = "asset-1", content = "image"): ImageAssetRecord {
  const blob = new Blob([content], { type: "image/png" });
  return {
    id,
    kind: "image",
    blob,
    mimeType: "image/png",
    fileName: "map.png",
    size: blob.size,
    createdAt: "2026-08-22T12:00:00.000Z",
  };
}

beforeEach(() => {
  databaseCounter += 1;
  database = new ExamBuilderDatabase(`asset-repository-${databaseCounter}`);
  repository = new IndexedDbAssetRepository(database);
});

afterEach(async () => {
  database.close();
  await Dexie.delete(database.name);
});

describe("IndexedDbAssetRepository", () => {
  it("round-trips Blob and metadata", async () => {
    const value = asset();
    await repository.save(value);

    const restored = await repository.findById(value.id);
    expect(restored).toMatchObject({
      id: value.id,
      mimeType: "image/png",
      fileName: "map.png",
      size: value.size,
    });
    expect(await restored?.blob.text()).toBe("image");
  });

  it("returns null for unknown assets", async () => {
    await expect(repository.findById("unknown")).resolves.toBeNull();
  });

  it("replaces the same ID and deletes it", async () => {
    await repository.save(asset("same", "first"));
    await repository.save(asset("same", "second"));
    expect(await (await repository.findById("same"))?.blob.text()).toBe(
      "second",
    );
    expect(await database.assets.count()).toBe(1);

    await repository.delete("same");
    await expect(repository.findById("same")).resolves.toBeNull();
  });

  it("keeps database instances isolated", async () => {
    const otherDatabase = new ExamBuilderDatabase(
      `asset-repository-${++databaseCounter}`,
    );
    const otherRepository = new IndexedDbAssetRepository(otherDatabase);
    try {
      await repository.save(asset());
      await expect(otherRepository.findById("asset-1")).resolves.toBeNull();
    } finally {
      otherDatabase.close();
      await Dexie.delete(otherDatabase.name);
    }
  });

  it("rejects invalid records", async () => {
    const invalid = { ...asset(), size: 999 };
    await expect(repository.save(invalid)).rejects.toBeInstanceOf(
      AssetPersistenceValidationError,
    );
  });
});
