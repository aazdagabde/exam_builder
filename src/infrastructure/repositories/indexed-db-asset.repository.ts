import { ImageAssetRecordSchema, type ImageAssetRecord } from "@/domain/assets";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import type { ExamBuilderDatabase } from "@/infrastructure/indexed-db";

export class AssetPersistenceValidationError extends Error {
  constructor(public readonly recordId: string) {
    super(`Invalid persisted asset: ${recordId}`);
    this.name = "AssetPersistenceValidationError";
  }
}

function parseAsset(value: unknown, id: string): ImageAssetRecord {
  const parsed = ImageAssetRecordSchema.safeParse(value);
  if (!parsed.success) throw new AssetPersistenceValidationError(id);
  return parsed.data;
}

export class IndexedDbAssetRepository implements AssetRepository {
  constructor(private readonly database: ExamBuilderDatabase) {}

  async findById(id: string): Promise<ImageAssetRecord | null> {
    const record: unknown = await this.database.assets.get(id);
    if (record === undefined) return null;
    return parseAsset(record, id);
  }

  async save(asset: ImageAssetRecord): Promise<void> {
    const validated = parseAsset(asset, asset.id);
    await this.database.assets.put(validated);
  }

  async delete(id: string): Promise<void> {
    await this.database.assets.delete(id);
  }
}
