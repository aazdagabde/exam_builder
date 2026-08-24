import {
  validateImageFile,
  type ImageAssetRecord,
  type ImageFileValidationFailure,
} from "@/domain/assets";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import { createId } from "@/lib/create-id";

export type SaveImageFileFailure =
  ImageFileValidationFailure | "ASSET_SAVE_FAILED";

export type SaveImageFileResult =
  | { ok: true; asset: ImageAssetRecord }
  | { ok: false; reason: SaveImageFileFailure };

export interface ImageAssetRuntime {
  createId(): string;
  now(): string;
}

const browserRuntime: ImageAssetRuntime = {
  createId,
  now: () => new Date().toISOString(),
};

export async function saveImageFile(
  file: File,
  repository: AssetRepository,
  runtime: ImageAssetRuntime = browserRuntime,
): Promise<SaveImageFileResult> {
  const validation = validateImageFile(file);
  if (!validation.ok) return validation;

  const asset: ImageAssetRecord = {
    id: runtime.createId(),
    kind: "image",
    blob: file,
    mimeType: validation.mimeType,
    fileName: file.name,
    size: file.size,
    createdAt: runtime.now(),
  };

  try {
    await repository.save(asset);
    return { ok: true, asset };
  } catch {
    return { ok: false, reason: "ASSET_SAVE_FAILED" };
  }
}
