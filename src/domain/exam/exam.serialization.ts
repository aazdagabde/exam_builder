import { ExamSchema } from "@/domain/exam/exam.schema";
import { migrateExamToLatest } from "@/domain/exam/migrations/exam.migrations";
import type { Exam } from "@/domain/exam/exam.types";

export function serializeExam(exam: Exam): string {
  return JSON.stringify(ExamSchema.parse(exam));
}

export function deserializeExam(json: string): Exam {
  const data: unknown = JSON.parse(json);
  return migrateExamToLatest(data);
}
