import { createEmptyExam, type Exam, type ExamMetadata } from "@/domain/exam";
import type { NewExamDraft } from "@/features/exams/models/new-exam-draft";

export interface CreateExamFromDraftRuntime {
  examId: string;
  now: string;
  createSectionId(): string;
}

function optionalTrimmedValue(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? undefined : trimmedValue;
}

function createMetadata(draft: NewExamDraft): ExamMetadata {
  const institution = optionalTrimmedValue(draft.institution);
  const teacherName = optionalTrimmedValue(draft.teacherName);
  const examNumber = optionalTrimmedValue(draft.examNumber);

  return {
    title: draft.title.trim(),
    academicYear: draft.academicYear.trim(),
    level: draft.level.trim(),
    subject: draft.subject.trim(),
    totalPoints: 20,
    ...(institution ? { institution } : {}),
    ...(teacherName ? { teacherName } : {}),
    ...(draft.durationMinutes !== undefined
      ? { durationMinutes: draft.durationMinutes }
      : {}),
    ...(examNumber ? { examNumber } : {}),
  };
}

export function createExamFromDraft(
  draft: NewExamDraft,
  runtime: CreateExamFromDraftRuntime,
): Exam {
  const baseExam = createEmptyExam({
    id: runtime.examId,
    now: runtime.now,
    documentLanguage: draft.documentLanguage,
    templateId: draft.templateId,
  });

  return {
    ...baseExam,
    metadata: createMetadata(draft),
    sections: draft.sections.map((section) => {
      const subject = optionalTrimmedValue(section.subject ?? "");

      return {
        id: runtime.createSectionId(),
        title: section.title.trim(),
        ...(subject ? { subject } : {}),
        blocks: [],
      };
    }),
  };
}
