import type { ImageAssetRecord } from "@/domain/assets";

export interface AssetRepository {
  findById(id: string): Promise<ImageAssetRecord | null>;
  save(asset: ImageAssetRecord): Promise<void>;
  delete(id: string): Promise<void>;
}
