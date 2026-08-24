import { ImageAssetRecordSchema } from "@/domain/assets";
import { ExamSchema, type Exam } from "@/domain/exam";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import { getSafeExamBaseName } from "@/features/exams/services/exam-export-file-name";
import {
  bytesToBase64,
  sha256,
} from "@/features/project-backup/project-backup.binary";
import { ProjectBackupError } from "@/features/project-backup/project-backup.errors";
import { collectReferencedAssetIds } from "@/features/project-backup/project-backup.exam-assets";
import {
  CURRENT_PROJECT_BACKUP_VERSION,
  PROJECT_BACKUP_FORMAT,
  type BackupAsset,
  type ExamProjectBackup,
} from "@/features/project-backup/project-backup.types";

export interface CreateProjectBackupOptions {
  exam: Exam;
  assetRepository: AssetRepository;
  now?(): string;
}

export async function createProjectBackup({
  exam,
  assetRepository,
  now = () => new Date().toISOString(),
}: CreateProjectBackupOptions): Promise<ExamProjectBackup> {
  const parsedExam = ExamSchema.safeParse(exam);
  if (!parsedExam.success) throw new ProjectBackupError("INVALID_EXAM");

  const assets: BackupAsset[] = [];

  // Deliberately sequential: each image temporarily exists as both bytes and
  // base64, so bounded work avoids multiplying the browser memory peak.
  for (const assetId of collectReferencedAssetIds(parsedExam.data)) {
    let storedAsset;
    try {
      storedAsset = await assetRepository.findById(assetId);
    } catch (cause: unknown) {
      if (cause instanceof ProjectBackupError) throw cause;
      throw new ProjectBackupError("ASSET_READ_FAILED", { cause, assetId });
    }

    if (storedAsset === null) {
      throw new ProjectBackupError("MISSING_REFERENCED_ASSET", { assetId });
    }

    const parsedAsset = ImageAssetRecordSchema.safeParse(storedAsset);
    if (!parsedAsset.success) {
      throw new ProjectBackupError("ASSET_READ_FAILED", {
        cause: parsedAsset.error,
        assetId,
      });
    }

    try {
      const bytes = new Uint8Array(await parsedAsset.data.blob.arrayBuffer());
      assets.push({
        id: parsedAsset.data.id,
        mimeType: parsedAsset.data.mimeType,
        ...(parsedAsset.data.fileName === undefined
          ? {}
          : { fileName: parsedAsset.data.fileName }),
        size: parsedAsset.data.size,
        createdAt: parsedAsset.data.createdAt,
        dataBase64: bytesToBase64(bytes),
        sha256: await sha256(bytes),
      });
    } catch (cause: unknown) {
      if (cause instanceof ProjectBackupError) throw cause;
      throw new ProjectBackupError("ASSET_READ_FAILED", { cause, assetId });
    }
  }

  return {
    format: PROJECT_BACKUP_FORMAT,
    backupVersion: CURRENT_PROJECT_BACKUP_VERSION,
    exportedAt: now(),
    exam: parsedExam.data,
    assets,
  };
}

export function serializeProjectBackup(backup: ExamProjectBackup): string {
  return JSON.stringify(backup);
}

export function getProjectBackupFileName(exam: Exam): string {
  return `${getSafeExamBaseName(exam)}.exam.json`;
}

export function downloadProjectBackup(
  backup: ExamProjectBackup,
  options: {
    document?: Document;
    urlApi?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  } = {},
): string {
  const documentObject = options.document ?? document;
  const urlApi = options.urlApi ?? URL;
  const fileName = getProjectBackupFileName(backup.exam);
  const blob = new Blob([serializeProjectBackup(backup)], {
    type: "application/json;charset=utf-8",
  });
  const url = urlApi.createObjectURL(blob);
  const anchor = documentObject.createElement("a");

  try {
    anchor.href = url;
    anchor.download = fileName;
    anchor.hidden = true;
    documentObject.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    urlApi.revokeObjectURL(url);
  }

  return fileName;
}
