import type { ImageAssetMimeType } from "@/domain/assets";
import type { Exam } from "@/domain/exam";

export const PROJECT_BACKUP_FORMAT = "exam-builder-project" as const;
export const CURRENT_PROJECT_BACKUP_VERSION = 1 as const;

// JSON base64 adds roughly 33% to binary data. 100 MiB supports several
// maximum-size images while keeping the in-memory browser import bounded.
export const MAX_PROJECT_BACKUP_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export interface BackupAsset {
  id: string;
  mimeType: ImageAssetMimeType;
  fileName?: string;
  size: number;
  createdAt: string;
  dataBase64: string;
  sha256: string;
}

export interface ExamProjectBackup {
  format: typeof PROJECT_BACKUP_FORMAT;
  backupVersion: typeof CURRENT_PROJECT_BACKUP_VERSION;
  exportedAt: string;
  exam: Exam;
  assets: BackupAsset[];
}

export interface ValidatedBackupAsset extends BackupAsset {
  blob: Blob;
}

export interface PreparedProjectImport {
  backup: ExamProjectBackup;
  referencedAssetIds: string[];
  assets: ValidatedBackupAsset[];
}

export type ProjectImportCollisionResolution = "copy" | "replace" | "cancel";

export type ProjectImportResult =
  | { status: "cancelled" }
  | {
      status: "imported";
      exam: Exam;
      importedAssetIds: string[];
      collisionResolution: "none" | "copy" | "replace";
    };
