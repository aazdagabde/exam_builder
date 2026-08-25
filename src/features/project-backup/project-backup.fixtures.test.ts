import type { ImageAssetMimeType, ImageAssetRecord } from "@/domain/assets";
import {
  createEmptyExam,
  CURRENT_EXAM_SCHEMA_VERSION,
  type Exam,
} from "@/domain/exam";
import {
  allBlockExamples,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import {
  createProjectBackup,
  downloadProjectBackup,
  getProjectBackupFileName,
} from "@/features/project-backup/export-project-backup";
import { ProjectBackupError } from "@/features/project-backup/project-backup.errors";
import {
  prepareProjectImport,
  readProjectBackupFile,
} from "@/features/project-backup/prepare-project-import";
import {
  MAX_PROJECT_BACKUP_FILE_SIZE_BYTES,
  type ExamProjectBackup,
} from "@/features/project-backup/project-backup.types";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

const TIME = "2026-08-24T12:00:00.000Z";

function imageAsset(
  id: string,
  mimeType: ImageAssetMimeType,
  bytes: number[],
): ImageAssetRecord {
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  return {
    id,
    kind: "image",
    blob,
    mimeType,
    fileName: `${id}.img`,
    size: blob.size,
    createdAt: TIME,
  };
}

function examWithImages(ids: string[], title = "فرض محروس"): Exam {
  const exam = createEmptyExam({
    id: "exam-1",
    now: TIME,
    documentLanguage: "ar",
  });
  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title,
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
      academicYear: "2026-2027",
    },
    sections: [
      {
        id: "section-1",
        title: "التاريخ",
        blocks: ids.map((imageId, index) => ({
          id: `image-block-${index}`,
          type: "image" as const,
          startsNewQuestion: false,
          order: index,
          imageId,
        })),
      },
    ],
  };
}

async function expectBackupError(
  promise: Promise<unknown>,
  code: ProjectBackupError["code"],
) {
  await expect(promise).rejects.toMatchObject({ code });
}

describe("project backup export and validation", () => {
  it("exports an Exam without images with an empty assets array", async () => {
    const exam = examWithImages([]);
    const backup = await createProjectBackup({
      exam,
      assetRepository: new FakeAssetRepository(),
      now: () => TIME,
    });

    expect(backup).toMatchObject({
      format: "exam-builder-project",
      backupVersion: 1,
      exportedAt: TIME,
      exam,
      assets: [],
    });
  });

  it("round-trips Timeline and Chart blocks in backup envelope v1", async () => {
    const exam = examWithImages([]);
    exam.sections = [
      createTestSection(
        allBlockExamples.filter(
          (block) => block.type === "timeline" || block.type === "chart",
        ),
      ),
    ];
    const backup = await createProjectBackup({
      exam,
      assetRepository: new FakeAssetRepository(),
      now: () => TIME,
    });
    const prepared = await prepareProjectImport(JSON.stringify(backup));

    expect(prepared.backup.backupVersion).toBe(1);
    expect(prepared.backup.exam.schemaVersion).toBe(
      CURRENT_EXAM_SCHEMA_VERSION,
    );
    expect(prepared.backup.exam.sections[0]!.blocks).toEqual(
      exam.sections[0]!.blocks,
    );
    expect(
      prepared.backup.exam.sections[0]!.blocks.map((block) => block.type),
    ).toEqual(["timeline", "chart"]);
  });

  it("round-trips numbering intent and migrates schema v1 exams without it", async () => {
    const exam = examWithImages([]);
    exam.sections[0]!.blocks = [
      {
        id: "question",
        type: "question",
        order: 0,
        question: "",
        answerMode: "none",
        startsNewQuestion: true,
      },
    ];
    const current = await createProjectBackup({
      exam,
      assetRepository: new FakeAssetRepository(),
      now: () => TIME,
    });
    expect(
      (await prepareProjectImport(JSON.stringify(current))).backup.exam,
    ).toEqual(exam);

    const previousExam = structuredClone(exam) as unknown as {
      schemaVersion: number;
      settings: { questionNumbering?: unknown };
      sections: Array<{ blocks: Array<{ startsNewQuestion?: boolean }> }>;
    };
    previousExam.schemaVersion = 1;
    delete previousExam.settings.questionNumbering;
    delete previousExam.sections[0]!.blocks[0]!.startsNewQuestion;
    expect(
      (
        await prepareProjectImport(
          JSON.stringify({ ...current, exam: previousExam }),
        )
      ).backup.exam,
    ).toEqual(exam);
  });

  it("migrates a v1 backup with an image while preserving its asset", async () => {
    const stored = imageAsset("legacy-image", "image/png", [1, 2, 3, 4]);
    const current = await createProjectBackup({
      exam: examWithImages([stored.id]),
      assetRepository: new FakeAssetRepository([stored]),
      now: () => TIME,
    });
    const previousExam = structuredClone(current.exam) as unknown as {
      schemaVersion: number;
      settings: { questionNumbering?: unknown };
      sections: Array<{ blocks: Array<{ startsNewQuestion?: boolean }> }>;
    };
    previousExam.schemaVersion = 1;
    delete previousExam.settings.questionNumbering;
    delete previousExam.sections[0]!.blocks[0]!.startsNewQuestion;

    const prepared = await prepareProjectImport(
      JSON.stringify({ ...current, exam: previousExam }),
    );

    expect(prepared.backup.backupVersion).toBe(1);
    expect(prepared.backup.exam.schemaVersion).toBe(
      CURRENT_EXAM_SCHEMA_VERSION,
    );
    expect(prepared.backup.exam.sections[0]!.blocks[0]).toMatchObject({
      type: "image",
      imageId: stored.id,
      startsNewQuestion: false,
    });
    expect(prepared.assets).toHaveLength(1);
    expect([
      ...new Uint8Array(await prepared.assets[0]!.blob.arrayBuffer()),
    ]).toEqual([1, 2, 3, 4]);
  });

  it.each([
    ["image/png", [0x89, 0x50, 0x4e, 0x47]],
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xdb]],
    ["image/webp", [0x52, 0x49, 0x46, 0x46]],
  ] as const)("round-trips %s bytes exactly", async (mimeType, bytes) => {
    const stored = imageAsset("asset-1", mimeType, [...bytes]);
    const backup = await createProjectBackup({
      exam: examWithImages([stored.id]),
      assetRepository: new FakeAssetRepository([stored]),
      now: () => TIME,
    });
    const prepared = await prepareProjectImport(JSON.stringify(backup));

    expect(prepared.assets).toHaveLength(1);
    expect([
      ...new Uint8Array(await prepared.assets[0]!.blob.arrayBuffer()),
    ]).toEqual([...bytes]);
  });

  it("exports a shared image once and only queries referenced assets", async () => {
    const shared = imageAsset("shared", "image/png", [1, 2, 3]);
    const unreferenced = imageAsset("unused", "image/png", [4]);
    const repository = new FakeAssetRepository([shared, unreferenced]);
    const backup = await createProjectBackup({
      exam: examWithImages(["shared", "shared"]),
      assetRepository: repository,
    });

    expect(backup.assets.map((asset) => asset.id)).toEqual(["shared"]);
    expect(repository.foundIds).toEqual(["shared"]);
  });

  it("blocks export when a referenced image is missing", async () => {
    await expectBackupError(
      createProjectBackup({
        exam: examWithImages(["missing"]),
        assetRepository: new FakeAssetRepository(),
      }),
      "MISSING_REFERENCED_ASSET",
    );
  });

  it("preserves Arabic and accented characters in a safe file name", () => {
    expect(
      getProjectBackupFileName(examWithImages([], "فرض مراقب رقم 2")),
    ).toBe("فرض مراقب رقم 2 - الثالثة إعدادي.exam.json");
    expect(getProjectBackupFileName(examWithImages([], "Contrôle n° 2"))).toBe(
      "Contrôle n° 2 - الثالثة إعدادي.exam.json",
    );
  });

  it("downloads compact application/json and always revokes its object URL", async () => {
    const backup = await createProjectBackup({
      exam: examWithImages([]),
      assetRepository: new FakeAssetRepository(),
      now: () => TIME,
    });
    let downloadedName = "";
    let downloadedBlob: Blob | undefined;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedName = this.download;
      });
    const revokeObjectURL = vi.fn();

    try {
      const fileName = downloadProjectBackup(backup, {
        document,
        urlApi: {
          createObjectURL: (blob) => {
            if (!(blob instanceof Blob)) throw new Error("Expected Blob");
            downloadedBlob = blob;
            return "blob:project";
          },
          revokeObjectURL,
        },
      });

      expect(fileName).toBe(downloadedName);
      expect(fileName).toMatch(/\.exam\.json$/);
      expect(downloadedBlob?.type).toBe("application/json;charset=utf-8");
      expect(await downloadedBlob?.text()).toBe(JSON.stringify(backup));
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:project");
      expect(document.querySelector('a[download$=".exam.json"]')).toBeNull();
    } finally {
      click.mockRestore();
    }
  });

  it.each([
    ["{", "MALFORMED_JSON"],
    [JSON.stringify({ format: "other", backupVersion: 1 }), "WRONG_FORMAT"],
  ] as const)("rejects invalid envelopes", async (source, code) => {
    await expectBackupError(prepareProjectImport(source), code);
  });

  it("rejects future backup versions distinctly", async () => {
    await expectBackupError(
      prepareProjectImport(
        JSON.stringify({ format: "exam-builder-project", backupVersion: 2 }),
      ),
      "UNSUPPORTED_BACKUP_VERSION",
    );
  });

  it("rejects an invalid Exam distinctly", async () => {
    await expectBackupError(
      prepareProjectImport(
        JSON.stringify({
          format: "exam-builder-project",
          backupVersion: 1,
          exportedAt: TIME,
          exam: { id: "invalid" },
          assets: [],
        }),
      ),
      "EXAM_MIGRATION_FAILED",
    );
  });

  it("rejects a future inner Exam schema without changing backupVersion", async () => {
    const backup = await createProjectBackup({
      exam: examWithImages([]),
      assetRepository: new FakeAssetRepository(),
      now: () => TIME,
    });

    await expectBackupError(
      prepareProjectImport(
        JSON.stringify({
          ...backup,
          backupVersion: 1,
          exam: { ...backup.exam, schemaVersion: 999 },
        }),
      ),
      "UNSUPPORTED_FUTURE_EXAM_SCHEMA",
    );
  });

  it("detects missing references, duplicate IDs, size and checksum corruption", async () => {
    const stored = imageAsset("asset-1", "image/png", [1, 2, 3]);
    const valid = await createProjectBackup({
      exam: examWithImages([stored.id]),
      assetRepository: new FakeAssetRepository([stored]),
      now: () => TIME,
    });

    const missing: ExamProjectBackup = { ...valid, assets: [] };
    await expectBackupError(
      prepareProjectImport(JSON.stringify(missing)),
      "MISSING_REFERENCED_ASSET",
    );

    const duplicate: ExamProjectBackup = {
      ...valid,
      assets: [valid.assets[0]!, valid.assets[0]!],
    };
    await expectBackupError(
      prepareProjectImport(JSON.stringify(duplicate)),
      "DUPLICATE_ASSET_ID",
    );

    const wrongSize: ExamProjectBackup = {
      ...valid,
      assets: [{ ...valid.assets[0]!, size: 99 }],
    };
    await expectBackupError(
      prepareProjectImport(JSON.stringify(wrongSize)),
      "ASSET_SIZE_MISMATCH",
    );

    const wrongChecksum: ExamProjectBackup = {
      ...valid,
      assets: [{ ...valid.assets[0]!, sha256: "0".repeat(64) }],
    };
    await expectBackupError(
      prepareProjectImport(JSON.stringify(wrongChecksum)),
      "ASSET_CHECKSUM_MISMATCH",
    );
  });

  it("distinguishes invalid base64 and unsupported image MIME", async () => {
    const stored = imageAsset("asset-1", "image/png", [1, 2, 3]);
    const valid = await createProjectBackup({
      exam: examWithImages([stored.id]),
      assetRepository: new FakeAssetRepository([stored]),
    });
    await expectBackupError(
      prepareProjectImport(
        JSON.stringify({
          ...valid,
          assets: [{ ...valid.assets[0], dataBase64: "%%%" }],
        }),
      ),
      "INVALID_BASE64",
    );
    await expectBackupError(
      prepareProjectImport(
        JSON.stringify({
          ...valid,
          assets: [{ ...valid.assets[0], mimeType: "image/gif" }],
        }),
      ),
      "UNSUPPORTED_ASSET_MIME_TYPE",
    );
  });

  it("rejects an oversized project before reading it", async () => {
    const text = vi.fn(async () => "{}");
    await expectBackupError(
      readProjectBackupFile({
        size: MAX_PROJECT_BACKUP_FILE_SIZE_BYTES + 1,
        text,
      }),
      "FILE_TOO_LARGE",
    );
    expect(text).not.toHaveBeenCalled();
  });

  it("ignores valid unreferenced assets after validating the package", async () => {
    const used = imageAsset("used", "image/png", [1]);
    const unused = imageAsset("unused", "image/jpeg", [2]);
    const backup = await createProjectBackup({
      exam: examWithImages([used.id, unused.id]),
      assetRepository: new FakeAssetRepository([used, unused]),
    });
    backup.exam = examWithImages([used.id]);

    const prepared = await prepareProjectImport(JSON.stringify(backup));
    expect(prepared.assets.map((asset) => asset.id)).toEqual(["used"]);
  });
});
