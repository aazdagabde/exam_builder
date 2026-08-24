// @vitest-environment node

import {
  CURRENT_EXAM_SCHEMA_VERSION,
  createEmptyExam,
  deserializeExam,
  ExamSchema,
  getDocumentDirection,
  serializeExam,
} from "@/domain/exam";
import { FIXED_NOW } from "@/domain/exam/__tests__/exam.fixtures";

describe("Exam factory and serialization", () => {
  it("creates an empty Exam accepted by ExamSchema", () => {
    const exam = createEmptyExam({
      id: "exam-empty",
      now: FIXED_NOW,
      documentLanguage: "ar",
    });

    expect(ExamSchema.parse(exam)).toEqual(exam);
    expect(exam.schemaVersion).toBe(CURRENT_EXAM_SCHEMA_VERSION);
    expect(exam.sections).toEqual([]);
  });

  it("round-trips an Exam through JSON and Zod", () => {
    const exam = createEmptyExam({
      id: "exam-serialization",
      now: FIXED_NOW,
      documentLanguage: "fr",
      templateId: "classic",
    });

    expect(deserializeExam(serializeExam(exam))).toEqual(exam);
  });

  it("migrates previous schema input at the deserialization boundary", () => {
    const current = createEmptyExam({
      id: "exam-previous-serialization",
      now: FIXED_NOW,
      documentLanguage: "fr",
    });
    const previous = structuredClone(current) as unknown as {
      schemaVersion: number;
      settings: { questionNumbering?: unknown };
    };
    previous.schemaVersion = 1;
    delete previous.settings.questionNumbering;

    expect(deserializeExam(JSON.stringify(previous))).toEqual(current);
  });

  it("derives document direction without storing duplicate state", () => {
    expect(getDocumentDirection("fr")).toBe("ltr");
    expect(getDocumentDirection("ar")).toBe("rtl");
  });
});
