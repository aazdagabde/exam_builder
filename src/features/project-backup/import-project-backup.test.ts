import type { ImageAssetRecord } from "@/domain/assets";
import {
  createEmptyExam,
  CURRENT_EXAM_SCHEMA_VERSION,
  type Exam,
} from "@/domain/exam";
import { createProjectBackup } from "@/features/project-backup/export-project-backup";
import {
  importProjectBackup,
  type ProjectImportRuntime,
} from "@/features/project-backup/import-project-backup";
import { prepareProjectImport } from "@/features/project-backup/prepare-project-import";
import { FakeAssetRepository } from "@/test/fake-asset.repository";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

const CREATED_AT = "2025-09-01T08:00:00.000Z";
const UPDATED_AT = "2026-08-24T08:00:00.000Z";
const IMPORTED_AT = "2026-08-24T12:00:00.000Z";

function sourceExam(): Exam {
  const exam = createEmptyExam({
    id: "source-exam",
    now: CREATED_AT,
    documentLanguage: "ar",
  });
  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title: "فرض محروس",
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
      academicYear: "2025-2026",
    },
    sections: [
      {
        id: "source-section",
        title: "التاريخ",
        blocks: [
          {
            id: "source-image-block-1",
            type: "image",
            startsNewQuestion: false,
            order: 0,
            imageId: "source-asset",
          },
          {
            id: "source-image-block-2",
            type: "image",
            startsNewQuestion: false,
            order: 1,
            imageId: "source-asset",
          },
          {
            id: "source-definition",
            type: "definition",
            startsNewQuestion: true,
            order: 2,
            items: [{ id: "source-term", term: "مفهوم", answerLines: 2 }],
          },
        ],
      },
    ],
    updatedAt: UPDATED_AT,
  };
}

function sourceAsset(): ImageAssetRecord {
  const blob = new Blob([new Uint8Array([0, 255, 4, 8])], {
    type: "image/png",
  });
  return {
    id: "source-asset",
    kind: "image",
    blob,
    mimeType: "image/png",
    fileName: "خريطة.png",
    size: blob.size,
    createdAt: CREATED_AT,
  };
}

function runtime(...ids: string[]): ProjectImportRuntime {
  let index = 0;
  return {
    createId: () => ids[index++] ?? `generated-${index}`,
    now: () => IMPORTED_AT,
  };
}

async function preparedProject() {
  const backup = await createProjectBackup({
    exam: sourceExam(),
    assetRepository: new FakeAssetRepository([sourceAsset()]),
    now: () => IMPORTED_AT,
  });
  return prepareProjectImport(JSON.stringify(backup));
}

describe("importProjectBackup", () => {
  it("migrates a previous Exam schema before saving the imported project", async () => {
    const backup = await createProjectBackup({
      exam: sourceExam(),
      assetRepository: new FakeAssetRepository([sourceAsset()]),
      now: () => IMPORTED_AT,
    });
    const previousExam = structuredClone(backup.exam) as unknown as {
      schemaVersion: number;
      settings: { questionNumbering?: unknown };
      sections: Array<{ blocks: Array<{ startsNewQuestion?: boolean }> }>;
    };
    previousExam.schemaVersion = 1;
    delete previousExam.settings.questionNumbering;
    for (const section of previousExam.sections) {
      for (const block of section.blocks) delete block.startsNewQuestion;
    }

    const prepared = await prepareProjectImport(
      JSON.stringify({ ...backup, exam: previousExam }),
    );
    const exams = new FakeExamRepository();
    const result = await importProjectBackup({
      prepared,
      examRepository: exams,
      assetRepository: new FakeAssetRepository(),
      runtime: runtime("migrated-asset"),
    });

    expect(result.status).toBe("imported");
    expect(exams.savedExams).toHaveLength(1);
    expect(exams.savedExams[0]).toMatchObject({
      schemaVersion: CURRENT_EXAM_SCHEMA_VERSION,
      settings: {
        questionNumbering: { enabled: true, restartPerSection: true },
      },
    });
    expect(
      exams.savedExams[0]!.sections[0]!.blocks.map(
        (block) => block.startsNewQuestion,
      ),
    ).toEqual([false, false, true]);
  });

  it("preserves Exam ID and timestamps without collision while remapping shared assets", async () => {
    const prepared = await preparedProject();
    const exams = new FakeExamRepository();
    const assets = new FakeAssetRepository();
    const result = await importProjectBackup({
      prepared,
      examRepository: exams,
      assetRepository: assets,
      runtime: runtime("local-asset"),
    });

    expect(result.status).toBe("imported");
    if (result.status !== "imported") return;
    expect(result.collisionResolution).toBe("none");
    expect(result.exam.id).toBe("source-exam");
    expect(result.exam.createdAt).toBe(CREATED_AT);
    expect(result.exam.updatedAt).toBe(UPDATED_AT);
    const imageIds = result.exam.sections[0]!.blocks.filter(
      (block) => block.type === "image",
    ).map((block) => block.imageId);
    expect(imageIds).toEqual(["local-asset", "local-asset"]);
    expect(assets.savedAssets).toHaveLength(1);
    expect(assets.savedAssets[0]).toMatchObject({
      id: "local-asset",
      fileName: "خريطة.png",
      mimeType: "image/png",
      createdAt: CREATED_AT,
    });
    expect([
      ...new Uint8Array(await assets.savedAssets[0]!.blob.arrayBuffer()),
    ]).toEqual([0, 255, 4, 8]);
  });

  it("imports a collision as a deep copy without changing the title", async () => {
    const prepared = await preparedProject();
    const exams = new FakeExamRepository([sourceExam()]);
    const result = await importProjectBackup({
      prepared,
      collisionResolution: "copy",
      examRepository: exams,
      assetRepository: new FakeAssetRepository(),
      runtime: runtime(
        "copy-asset",
        "copy-exam",
        "copy-section",
        "copy-image-1",
        "copy-image-2",
        "copy-definition",
        "copy-term",
      ),
    });

    expect(result.status).toBe("imported");
    if (result.status !== "imported") return;
    expect(result.exam.id).toBe("copy-exam");
    expect(result.exam.metadata.title).toBe("فرض محروس");
    expect(result.exam.createdAt).toBe(IMPORTED_AT);
    expect(result.exam.updatedAt).toBe(IMPORTED_AT);
    expect(result.exam.sections[0]!.id).toBe("copy-section");
    expect(result.exam.sections[0]!.blocks.map((block) => block.id)).toEqual([
      "copy-image-1",
      "copy-image-2",
      "copy-definition",
    ]);
    const definition = result.exam.sections[0]!.blocks[2];
    expect(definition?.type).toBe("definition");
    if (definition?.type === "definition") {
      expect(definition.items[0]!.id).toBe("copy-term");
    }
  });

  it("replaces a colliding Exam while preserving backup identity and timestamps", async () => {
    const prepared = await preparedProject();
    const local = {
      ...sourceExam(),
      metadata: { ...sourceExam().metadata, title: "Local" },
    };
    const exams = new FakeExamRepository([local]);
    const result = await importProjectBackup({
      prepared,
      collisionResolution: "replace",
      examRepository: exams,
      assetRepository: new FakeAssetRepository(),
      runtime: runtime("replacement-asset"),
    });

    expect(result.status).toBe("imported");
    if (result.status !== "imported") return;
    expect(result.collisionResolution).toBe("replace");
    expect(result.exam.id).toBe("source-exam");
    expect(result.exam.metadata.title).toBe("فرض محروس");
    expect(result.exam.createdAt).toBe(CREATED_AT);
    expect(result.exam.updatedAt).toBe(UPDATED_AT);
  });

  it("cancels a collision without writing anything", async () => {
    const exams = new FakeExamRepository([sourceExam()]);
    const assets = new FakeAssetRepository();
    await expect(
      importProjectBackup({
        prepared: await preparedProject(),
        collisionResolution: "cancel",
        examRepository: exams,
        assetRepository: assets,
      }),
    ).resolves.toEqual({ status: "cancelled" });
    expect(exams.savedExams).toEqual([]);
    expect(assets.savedAssets).toEqual([]);
  });

  it("requires an explicit resolution for a collision", async () => {
    await expect(
      importProjectBackup({
        prepared: await preparedProject(),
        examRepository: new FakeExamRepository([sourceExam()]),
        assetRepository: new FakeAssetRepository(),
      }),
    ).rejects.toMatchObject({ code: "COLLISION_RESOLUTION_REQUIRED" });
  });

  it("rolls back assets when Exam persistence fails", async () => {
    const assets = new FakeAssetRepository();
    const exams = new FakeExamRepository([], {
      save: async () => {
        throw new Error("exam save failed");
      },
    });

    await expect(
      importProjectBackup({
        prepared: await preparedProject(),
        examRepository: exams,
        assetRepository: assets,
        runtime: runtime("rollback-asset"),
      }),
    ).rejects.toMatchObject({
      code: "EXAM_SAVE_FAILED",
      rollbackFailures: 0,
    });
    expect(assets.deletedIds).toEqual(["rollback-asset"]);
  });

  it("rolls back the first asset when a later asset save fails", async () => {
    const basePrepared = await preparedProject();
    const sourceBackupAsset = basePrepared.backup.assets[0]!;
    const twoAssetBackup = {
      ...basePrepared.backup,
      exam: {
        ...basePrepared.backup.exam,
        sections: [
          {
            ...basePrepared.backup.exam.sections[0]!,
            blocks: [
              ...basePrepared.backup.exam.sections[0]!.blocks,
              {
                id: "second-image",
                type: "image" as const,
                startsNewQuestion: false,
                order: 3,
                imageId: "source-asset-2",
              },
            ],
          },
        ],
      },
      assets: [
        sourceBackupAsset,
        { ...sourceBackupAsset, id: "source-asset-2" },
      ],
    };
    const prepared = await prepareProjectImport(JSON.stringify(twoAssetBackup));
    let saveAttempt = 0;
    const assets = new FakeAssetRepository([], {
      save: async () => {
        saveAttempt += 1;
        if (saveAttempt === 2) throw new Error("second asset failed");
      },
    });

    await expect(
      importProjectBackup({
        prepared,
        examRepository: new FakeExamRepository(),
        assetRepository: assets,
        runtime: runtime("first-local", "second-local"),
      }),
    ).rejects.toMatchObject({ code: "ASSET_SAVE_FAILED" });
    expect(assets.deletedIds).toEqual(["first-local"]);
  });

  it("keeps the primary failure when rollback deletion also fails", async () => {
    const assets = new FakeAssetRepository([], {
      delete: async () => {
        throw new Error("rollback failed");
      },
    });
    const exams = new FakeExamRepository([], {
      save: async () => {
        throw new Error("exam save failed");
      },
    });

    await expect(
      importProjectBackup({
        prepared: await preparedProject(),
        examRepository: exams,
        assetRepository: assets,
        runtime: runtime("orphan-asset"),
      }),
    ).rejects.toMatchObject({
      code: "EXAM_SAVE_FAILED",
      rollbackFailures: 1,
    });
  });
});
