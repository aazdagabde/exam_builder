import { ImageAssetRecordSchema, type ImageAssetRecord } from "@/domain/assets";
import { duplicateExam, ExamSchema, type Exam } from "@/domain/exam";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import type { ExamRepository } from "@/domain/repositories/exam-repository";
import { ProjectBackupError } from "@/features/project-backup/project-backup.errors";
import { remapExamAssetIds } from "@/features/project-backup/project-backup.exam-assets";
import type {
  PreparedProjectImport,
  ProjectImportCollisionResolution,
  ProjectImportResult,
} from "@/features/project-backup/project-backup.types";
import { createId } from "@/lib/create-id";

export interface ProjectImportRuntime {
  createId(): string;
  now(): string;
}

const browserRuntime: ProjectImportRuntime = {
  createId,
  now: () => new Date().toISOString(),
};

async function allocateAssetId(
  repository: AssetRepository,
  reservedIds: Set<string>,
  runtime: ProjectImportRuntime,
): Promise<string> {
  for (;;) {
    const id = runtime.createId();
    if (reservedIds.has(id)) continue;
    let existingAsset;
    try {
      existingAsset = await repository.findById(id);
    } catch (cause: unknown) {
      throw new ProjectBackupError("ASSET_SAVE_FAILED", { cause });
    }
    if (existingAsset === null) {
      reservedIds.add(id);
      return id;
    }
  }
}

async function allocateExamId(
  repository: ExamRepository,
  runtime: ProjectImportRuntime,
): Promise<string> {
  for (;;) {
    const id = runtime.createId();
    try {
      if ((await repository.findById(id)) === null) return id;
    } catch (cause: unknown) {
      throw new ProjectBackupError("EXAM_LOOKUP_FAILED", { cause });
    }
  }
}

async function rollbackAssets(
  repository: AssetRepository,
  assetIds: readonly string[],
): Promise<number> {
  let failures = 0;
  for (const assetId of [...assetIds].reverse()) {
    try {
      await repository.delete(assetId);
    } catch {
      failures += 1;
    }
  }
  return failures;
}

export async function findProjectImportCollision(
  prepared: PreparedProjectImport,
  repository: ExamRepository,
): Promise<Exam | null> {
  try {
    return await repository.findById(prepared.backup.exam.id);
  } catch (cause: unknown) {
    throw new ProjectBackupError("EXAM_LOOKUP_FAILED", { cause });
  }
}

export async function importProjectBackup({
  prepared,
  collisionResolution,
  examRepository,
  assetRepository,
  runtime = browserRuntime,
}: {
  prepared: PreparedProjectImport;
  collisionResolution?: ProjectImportCollisionResolution;
  examRepository: ExamRepository;
  assetRepository: AssetRepository;
  runtime?: ProjectImportRuntime;
}): Promise<ProjectImportResult> {
  if (collisionResolution === "cancel") return { status: "cancelled" };

  const existingExam = await findProjectImportCollision(
    prepared,
    examRepository,
  );
  if (existingExam !== null && collisionResolution === undefined) {
    throw new ProjectBackupError("COLLISION_RESOLUTION_REQUIRED");
  }

  const reservedAssetIds = new Set(prepared.assets.map((asset) => asset.id));
  const assetIdMap = new Map<string, string>();
  const assetsToSave: ImageAssetRecord[] = [];

  for (const asset of prepared.assets) {
    const newId = await allocateAssetId(
      assetRepository,
      reservedAssetIds,
      runtime,
    );
    assetIdMap.set(asset.id, newId);
    assetsToSave.push(
      ImageAssetRecordSchema.parse({
        id: newId,
        kind: "image",
        blob: asset.blob,
        mimeType: asset.mimeType,
        ...(asset.fileName === undefined ? {} : { fileName: asset.fileName }),
        size: asset.size,
        createdAt: asset.createdAt,
      }),
    );
  }

  let exam = remapExamAssetIds(prepared.backup.exam, assetIdMap);
  let appliedResolution: "none" | "copy" | "replace" = "none";

  if (existingExam !== null && collisionResolution === "copy") {
    exam = duplicateExam(exam, {
      id: await allocateExamId(examRepository, runtime),
      now: runtime.now(),
      createInternalId: () => runtime.createId(),
    });
    appliedResolution = "copy";
  } else if (existingExam !== null && collisionResolution === "replace") {
    appliedResolution = "replace";
  }

  const parsedExam = ExamSchema.parse(exam);
  const savedAssetIds: string[] = [];

  try {
    for (const asset of assetsToSave) {
      await assetRepository.save(asset);
      savedAssetIds.push(asset.id);
    }
  } catch (cause: unknown) {
    const rollbackFailures = await rollbackAssets(
      assetRepository,
      savedAssetIds,
    );
    throw new ProjectBackupError("ASSET_SAVE_FAILED", {
      cause,
      rollbackFailures,
    });
  }

  try {
    await examRepository.save(parsedExam);
  } catch (cause: unknown) {
    const rollbackFailures = await rollbackAssets(
      assetRepository,
      savedAssetIds,
    );
    throw new ProjectBackupError("EXAM_SAVE_FAILED", {
      cause,
      rollbackFailures,
    });
  }

  return {
    status: "imported",
    exam: parsedExam,
    importedAssetIds: savedAssetIds,
    collisionResolution: appliedResolution,
  };
}
