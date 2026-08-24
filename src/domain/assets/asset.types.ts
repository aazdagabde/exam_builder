import { z } from "zod";

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type ImageAssetMimeType = (typeof ACCEPTED_IMAGE_MIME_TYPES)[number];

export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface ImageAssetRecord {
  id: string;
  kind: "image";
  blob: Blob;
  mimeType: ImageAssetMimeType;
  fileName?: string;
  size: number;
  createdAt: string;
}

function isBlob(value: unknown): value is Blob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Blob>;
  return (
    typeof candidate.size === "number" &&
    typeof candidate.type === "string" &&
    typeof candidate.slice === "function"
  );
}

export const ImageAssetRecordSchema = z
  .strictObject({
    id: z.string().min(1),
    kind: z.literal("image"),
    blob: z.custom<Blob>(isBlob, { message: "ASSET_BLOB_REQUIRED" }),
    mimeType: z.enum(ACCEPTED_IMAGE_MIME_TYPES),
    fileName: z.string().optional(),
    size: z.number().int().nonnegative(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .superRefine((asset, context) => {
    if (asset.blob.size !== asset.size) {
      context.addIssue({
        code: "custom",
        path: ["size"],
        message: "ASSET_SIZE_MISMATCH",
      });
    }
    if (asset.blob.type !== asset.mimeType) {
      context.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "ASSET_MIME_TYPE_MISMATCH",
      });
    }
  }) satisfies z.ZodType<ImageAssetRecord>;

export type ImageFileValidationFailure =
  "INVALID_IMAGE_TYPE" | "IMAGE_TOO_LARGE";

export type ImageFileValidationResult =
  | { ok: true; mimeType: ImageAssetMimeType }
  | { ok: false; reason: ImageFileValidationFailure };

export function validateImageFile(
  file: Pick<Blob, "size" | "type">,
): ImageFileValidationResult {
  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as ImageAssetMimeType)) {
    return { ok: false, reason: "INVALID_IMAGE_TYPE" };
  }
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return { ok: false, reason: "IMAGE_TOO_LARGE" };
  }
  return { ok: true, mimeType: file.type as ImageAssetMimeType };
}
