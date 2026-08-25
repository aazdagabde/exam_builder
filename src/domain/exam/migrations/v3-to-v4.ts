import { z } from "zod";

import {
  EXAM_SCHEMA_VERSION_3,
  EXAM_SCHEMA_VERSION_4,
} from "@/domain/exam/exam.types";

const examV3InputSchema = z
  .object({
    schemaVersion: z.literal(EXAM_SCHEMA_VERSION_3),
    settings: z
      .object({ documentLanguage: z.enum(["ar", "fr"]) })
      .passthrough(),
    sections: z.array(z.object({ blocks: z.array(z.unknown()) }).passthrough()),
  })
  .passthrough();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Preserves Phase 17A timelines as normal simple/sequence V4 blocks. */
export function migrateExamV3ToV4(input: unknown): unknown {
  const exam = examV3InputSchema.parse(input);
  const chronologyDirection =
    exam.settings.documentLanguage === "ar" ? "rtl" : "ltr";

  return {
    ...exam,
    schemaVersion: EXAM_SCHEMA_VERSION_4,
    sections: exam.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => {
        if (!isRecord(block) || block.type !== "timeline") return block;
        const events = Array.isArray(block.events) ? block.events : [];
        return {
          ...block,
          timelineStyle: "simple",
          spacingMode: "sequence",
          chronologyDirection,
          scale: null,
          periods: [],
          scaleCaption: "",
          events: events.map((event) =>
            isRecord(event)
              ? {
                  ...event,
                  axisValue: null,
                  description:
                    typeof event.description === "string"
                      ? event.description
                      : "",
                }
              : event,
          ),
        };
      }),
    })),
  };
}
