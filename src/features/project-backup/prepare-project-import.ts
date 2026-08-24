import { ExamMigrationError, migrateExamToLatest } from "@/domain/exam";
import { ProjectBackupError } from "@/features/project-backup/project-backup.errors";
import { collectReferencedAssetIds } from "@/features/project-backup/project-backup.exam-assets";
import {
  base64ToBlob,
  sha256,
} from "@/features/project-backup/project-backup.binary";
import {
  ExamProjectBackupInputSchema,
  ExamProjectBackupSchema,
} from "@/features/project-backup/project-backup.schema";
import {
  CURRENT_PROJECT_BACKUP_VERSION,
  MAX_PROJECT_BACKUP_FILE_SIZE_BYTES,
  PROJECT_BACKUP_FORMAT,
  type ExamProjectBackup,
  type PreparedProjectImport,
} from "@/features/project-backup/project-backup.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function classifySchemaFailure(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): ProjectBackupError {
  if (issues.some((issue) => issue.message === "DUPLICATE_ASSET_ID")) {
    return new ProjectBackupError("DUPLICATE_ASSET_ID");
  }

  if (
    issues.some(
      (issue) => issue.path[0] === "assets" && issue.path[2] === "mimeType",
    )
  ) {
    return new ProjectBackupError("UNSUPPORTED_ASSET_MIME_TYPE");
  }

  if (
    issues.some(
      (issue) => issue.path[0] === "assets" && issue.path[2] === "dataBase64",
    )
  ) {
    return new ProjectBackupError("INVALID_BASE64");
  }

  return new ProjectBackupError("INVALID_BACKUP");
}

export async function prepareProjectImport(
  input: string,
): Promise<PreparedProjectImport> {
  let raw: unknown;
  try {
    raw = JSON.parse(input) as unknown;
  } catch (cause: unknown) {
    throw new ProjectBackupError("MALFORMED_JSON", { cause });
  }

  if (!isRecord(raw) || raw.format !== PROJECT_BACKUP_FORMAT) {
    throw new ProjectBackupError("WRONG_FORMAT");
  }

  if (raw.backupVersion !== CURRENT_PROJECT_BACKUP_VERSION) {
    throw new ProjectBackupError("UNSUPPORTED_BACKUP_VERSION");
  }

  const parsed = ExamProjectBackupInputSchema.safeParse(raw);
  if (!parsed.success) throw classifySchemaFailure(parsed.error.issues);

  let migratedExam;
  try {
    migratedExam = migrateExamToLatest(parsed.data.exam);
  } catch (cause: unknown) {
    if (
      cause instanceof ExamMigrationError &&
      cause.code === "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
    ) {
      throw new ProjectBackupError("UNSUPPORTED_FUTURE_EXAM_SCHEMA", {
        cause,
      });
    }
    throw new ProjectBackupError("EXAM_MIGRATION_FAILED", { cause });
  }

  const current = ExamProjectBackupSchema.safeParse({
    ...parsed.data,
    exam: migratedExam,
  });
  if (!current.success) throw classifySchemaFailure(current.error.issues);

  const backup: ExamProjectBackup = current.data;
  const referencedAssetIds = collectReferencedAssetIds(backup.exam);
  const assetById = new Map(backup.assets.map((asset) => [asset.id, asset]));

  for (const assetId of referencedAssetIds) {
    if (!assetById.has(assetId)) {
      throw new ProjectBackupError("MISSING_REFERENCED_ASSET", { assetId });
    }
  }

  const validatedAssets = [];
  for (const asset of backup.assets) {
    let blob: Blob;
    try {
      blob = base64ToBlob(asset.dataBase64, asset.mimeType);
    } catch (cause: unknown) {
      throw new ProjectBackupError("INVALID_BASE64", {
        cause,
        assetId: asset.id,
      });
    }

    if (blob.size !== asset.size) {
      throw new ProjectBackupError("ASSET_SIZE_MISMATCH", {
        assetId: asset.id,
      });
    }

    if ((await sha256(blob)) !== asset.sha256) {
      throw new ProjectBackupError("ASSET_CHECKSUM_MISMATCH", {
        assetId: asset.id,
      });
    }

    if (referencedAssetIds.includes(asset.id)) {
      validatedAssets.push({ ...asset, blob });
    }
  }

  return { backup, referencedAssetIds, assets: validatedAssets };
}

export async function readProjectBackupFile(
  file: Pick<File, "size" | "text">,
): Promise<PreparedProjectImport> {
  if (file.size > MAX_PROJECT_BACKUP_FILE_SIZE_BYTES) {
    throw new ProjectBackupError("FILE_TOO_LARGE");
  }

  let text: string;
  try {
    text = await file.text();
  } catch (cause: unknown) {
    throw new ProjectBackupError("FILE_READ_FAILED", { cause });
  }

  return prepareProjectImport(text);
}
