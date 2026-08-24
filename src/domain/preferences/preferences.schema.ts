import { z } from "zod";

import type { UserPreferences } from "@/domain/preferences/preferences.types";

export const UserPreferencesSchema = z.strictObject({
  interfaceLanguage: z.enum(["fr", "ar"]),
}) satisfies z.ZodType<UserPreferences>;
