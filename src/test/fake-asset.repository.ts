import type { ImageAssetRecord } from "@/domain/assets";
import type { AssetRepository } from "@/domain/repositories/asset-repository";

interface FakeAssetRepositoryOptions {
  findById?(id: string): Promise<ImageAssetRecord | null>;
  save?(asset: ImageAssetRecord): Promise<void>;
  delete?(id: string): Promise<void>;
}

export class FakeAssetRepository implements AssetRepository {
  readonly records = new Map<string, ImageAssetRecord>();
  readonly foundIds: string[] = [];
  readonly savedAssets: ImageAssetRecord[] = [];
  readonly deletedIds: string[] = [];
  failOnSave = false;
  failOnFind = false;

  constructor(
    initial: ImageAssetRecord[] = [],
    private readonly options: FakeAssetRepositoryOptions = {},
  ) {
    for (const asset of initial) this.records.set(asset.id, asset);
  }

  async findById(id: string): Promise<ImageAssetRecord | null> {
    this.foundIds.push(id);
    if (this.failOnFind) throw new Error("Asset read failed");
    if (this.options.findById) return this.options.findById(id);
    return this.records.get(id) ?? null;
  }

  async save(asset: ImageAssetRecord): Promise<void> {
    if (this.failOnSave) throw new Error("Asset save failed");
    if (this.options.save) await this.options.save(asset);
    this.savedAssets.push(asset);
    this.records.set(asset.id, asset);
  }

  async delete(id: string): Promise<void> {
    this.deletedIds.push(id);
    if (this.options.delete) await this.options.delete(id);
    this.records.delete(id);
  }
}
