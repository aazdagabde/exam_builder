import { z } from "zod";

import {
  EXAM_SCHEMA_VERSION_2,
  EXAM_SCHEMA_VERSION_3,
} from "@/domain/exam/exam.types";

const examV2InputSchema = z
  .object({ schemaVersion: z.literal(EXAM_SCHEMA_VERSION_2) })
  .passthrough();

/** Pure version-only migration. Existing sections and blocks are untouched. */
export function migrateExamV2ToV3(input: unknown): unknown {
  const exam = examV2InputSchema.parse(input);
  return { ...exam, schemaVersion: EXAM_SCHEMA_VERSION_3 };
}
