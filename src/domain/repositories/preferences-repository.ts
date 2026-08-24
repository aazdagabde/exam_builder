import type { UserPreferences } from "@/domain/preferences";

export interface PreferencesRepository {
  get(): Promise<UserPreferences | null>;
  save(preferences: UserPreferences): Promise<void>;
}
