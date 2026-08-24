import { z } from "zod";

import { ACCEPTED_IMAGE_MIME_TYPES } from "@/domain/assets";
import { ExamSchema } from "@/domain/exam";
import {
  CURRENT_PROJECT_BACKUP_VERSION,
  PROJECT_BACKUP_FORMAT,
  type BackupAsset,
  type ExamProjectBackup,
} from "@/features/project-backup/project-backup.types";

const base64Schema = z
  .string()
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);

export const BackupAssetSchema = z.strictObject({
  id: z.string().min(1),
  mimeType: z.enum(ACCEPTED_IMAGE_MIME_TYPES),
  fileName: z.string().optional(),
  size: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  dataBase64: base64Schema,
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
}) satisfies z.ZodType<BackupAsset>;

function createBackupSchema<T extends z.ZodType>(examSchema: T) {
  return z
    .strictObject({
      format: z.literal(PROJECT_BACKUP_FORMAT),
      backupVersion: z.literal(CURRENT_PROJECT_BACKUP_VERSION),
      exportedAt: z.string().datetime({ offset: true }),
      exam: examSchema,
      assets: z.array(BackupAssetSchema),
    })
    .superRefine((backup, context) => {
      const ids = new Set<string>();
      backup.assets.forEach((asset, index) => {
        if (ids.has(asset.id)) {
          context.addIssue({
            code: "custom",
            path: ["assets", index, "id"],
            message: "DUPLICATE_ASSET_ID",
          });
        }
        ids.add(asset.id);
      });
    });
}

/** Envelope validation performed before the contained Exam is migrated. */
export const ExamProjectBackupInputSchema = createBackupSchema(z.unknown());

/** Strict envelope whose Exam is guaranteed to use the current schema. */
export const ExamProjectBackupSchema = createBackupSchema(
  ExamSchema,
) satisfies z.ZodType<ExamProjectBackup>;
