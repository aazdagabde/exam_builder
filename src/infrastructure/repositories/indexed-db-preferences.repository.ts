import { z } from "zod";

import {
  UserPreferencesSchema,
  type UserPreferences,
} from "@/domain/preferences";
import type { PreferencesRepository } from "@/domain/repositories/preferences-repository";
import type { ExamBuilderDatabase } from "@/infrastructure/indexed-db/database";
import { USER_PREFERENCES_RECORD_ID } from "@/infrastructure/indexed-db/database.types";

const persistedPreferencesRecordSchema = z.strictObject({
  id: z.literal(USER_PREFERENCES_RECORD_ID),
  preferences: UserPreferencesSchema,
});

export class PreferencesPersistenceValidationError extends Error {
  constructor(cause: unknown) {
    super("Persisted user preferences failed validation.", { cause });
    this.name = "PreferencesPersistenceValidationError";
  }
}

export class IndexedDbPreferencesRepository implements PreferencesRepository {
  constructor(private readonly database: ExamBuilderDatabase) {}

  async get(): Promise<UserPreferences | null> {
    const record: unknown = await this.database.preferences.get(
      USER_PREFERENCES_RECORD_ID,
    );

    if (record === undefined) {
      return null;
    }

    const result = persistedPreferencesRecordSchema.safeParse(record);

    if (!result.success) {
      throw new PreferencesPersistenceValidationError(result.error);
    }

    return result.data.preferences;
  }

  async save(preferences: UserPreferences): Promise<void> {
    const validPreferences = UserPreferencesSchema.parse(preferences);

    await this.database.preferences.put({
      id: USER_PREFERENCES_RECORD_ID,
      preferences: validPreferences,
    });
  }
}
