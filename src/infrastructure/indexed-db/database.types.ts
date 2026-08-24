import type { ImageAssetRecord } from "@/domain/assets";
import type { UserPreferences } from "@/domain/preferences";

export const USER_PREFERENCES_RECORD_ID = "user-preferences" as const;

/** Persistence accepts previous schema versions as raw migration input. */
export type PersistedExamRecord = unknown;
export type PersistedAssetRecord = ImageAssetRecord;

export interface PersistedPreferencesRecord {
  id: typeof USER_PREFERENCES_RECORD_ID;
  preferences: UserPreferences;
}
