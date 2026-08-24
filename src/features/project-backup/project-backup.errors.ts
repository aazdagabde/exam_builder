export type ProjectBackupErrorCode =
  | "FILE_TOO_LARGE"
  | "FILE_READ_FAILED"
  | "MALFORMED_JSON"
  | "WRONG_FORMAT"
  | "UNSUPPORTED_BACKUP_VERSION"
  | "INVALID_BACKUP"
  | "INVALID_EXAM"
  | "EXAM_MIGRATION_FAILED"
  | "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
  | "DUPLICATE_ASSET_ID"
  | "UNSUPPORTED_ASSET_MIME_TYPE"
  | "INVALID_BASE64"
  | "ASSET_SIZE_MISMATCH"
  | "ASSET_CHECKSUM_MISMATCH"
  | "MISSING_REFERENCED_ASSET"
  | "ASSET_READ_FAILED"
  | "ASSET_SAVE_FAILED"
  | "EXAM_SAVE_FAILED"
  | "EXAM_LOOKUP_FAILED"
  | "COLLISION_RESOLUTION_REQUIRED"
  | "SECURE_CONTEXT_REQUIRED";

export class ProjectBackupError extends Error {
  constructor(
    public readonly code: ProjectBackupErrorCode,
    options?: { cause?: unknown; assetId?: string; rollbackFailures?: number },
  ) {
    super(
      code,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "ProjectBackupError";
    this.assetId = options?.assetId;
    this.rollbackFailures = options?.rollbackFailures ?? 0;
  }

  readonly assetId?: string;
  readonly rollbackFailures: number;
}
