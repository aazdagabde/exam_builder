import type { ExamRepository } from "@/domain/repositories/exam-repository";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import type { PreferencesRepository } from "@/domain/repositories/preferences-repository";
import { examBuilderDatabase } from "@/infrastructure/indexed-db";
import { IndexedDbExamRepository } from "@/infrastructure/repositories/indexed-db-exam.repository";
import { IndexedDbAssetRepository } from "@/infrastructure/repositories/indexed-db-asset.repository";
import { IndexedDbPreferencesRepository } from "@/infrastructure/repositories/indexed-db-preferences.repository";

export * from "@/infrastructure/repositories/indexed-db-exam.repository";
export * from "@/infrastructure/repositories/indexed-db-asset.repository";
export * from "@/infrastructure/repositories/indexed-db-preferences.repository";

export const examRepository: ExamRepository = new IndexedDbExamRepository(
  examBuilderDatabase,
);
export const assetRepository: AssetRepository = new IndexedDbAssetRepository(
  examBuilderDatabase,
);
export const preferencesRepository: PreferencesRepository =
  new IndexedDbPreferencesRepository(examBuilderDatabase);
