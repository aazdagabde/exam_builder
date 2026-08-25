import { z } from "zod";

import {
  EXAM_SCHEMA_VERSION_4,
  EXAM_SCHEMA_VERSION_5,
} from "@/domain/exam/exam.types";

const examV4InputSchema = z
  .object({ schemaVersion: z.literal(EXAM_SCHEMA_VERSION_4) })
  .passthrough();

/** V5 introduces DiagramBlock without altering existing Exams. */
export function migrateExamV4ToV5(input: unknown): unknown {
  const exam = examV4InputSchema.parse(input);
  return { ...exam, schemaVersion: EXAM_SCHEMA_VERSION_5 };
}
