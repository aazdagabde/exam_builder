import { z } from "zod";

import type { ExamBlockType } from "@/domain/exam/blocks.types";
import {
  DEFAULT_QUESTION_NUMBERING_SETTINGS,
  getDefaultStartsNewQuestion,
} from "@/domain/exam/exam.question-numbering";
import {
  EXAM_SCHEMA_VERSION_1,
  EXAM_SCHEMA_VERSION_2,
} from "@/domain/exam/exam.types";

const examBlockTypeSchema = z.enum([
  "instruction",
  "text-document",
  "image",
  "question",
  "definition",
  "true-false",
  "multiple-choice",
  "fill-blank",
  "table",
  "matching",
  "essay",
  "free-text",
  "separator",
  "page-break",
]);

const examV1BlockInputSchema = z
  .object({
    id: z.string().min(1),
    type: examBlockTypeSchema,
  })
  .passthrough();

const examV1InputSchema = z
  .object({
    schemaVersion: z.literal(EXAM_SCHEMA_VERSION_1).optional(),
    id: z.string().min(1),
    settings: z.object({}).passthrough(),
    sections: z.array(
      z
        .object({
          id: z.string().min(1),
          blocks: z.array(examV1BlockInputSchema),
        })
        .passthrough(),
    ),
  })
  .passthrough();

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function migrateBlock(block: z.infer<typeof examV1BlockInputSchema>) {
  const type: ExamBlockType = block.type;

  if (type === "separator" || type === "page-break") {
    return { ...block, startsNewQuestion: false };
  }

  if (hasOwn(block, "startsNewQuestion")) return { ...block };

  return {
    ...block,
    startsNewQuestion: getDefaultStartsNewQuestion(type),
  };
}

/** Pure, non-destructive schema migration. IDs and timestamps are untouched. */
export function migrateExamV1ToV2(input: unknown): unknown {
  const exam = examV1InputSchema.parse(input);
  const settings = hasOwn(exam.settings, "questionNumbering")
    ? { ...exam.settings }
    : {
        ...exam.settings,
        questionNumbering: { ...DEFAULT_QUESTION_NUMBERING_SETTINGS },
      };

  return {
    ...exam,
    schemaVersion: EXAM_SCHEMA_VERSION_2,
    settings,
    sections: exam.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map(migrateBlock),
    })),
  };
}
