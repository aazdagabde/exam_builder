import {
  DEFAULT_EXAM_TEMPLATE_ID,
  DEFAULT_SOCIAL_STUDIES_SECTIONS,
  DEFAULT_SOCIAL_STUDIES_SUBJECT,
} from "@/features/exams/constants/new-exam";
import type {
  NewExamDraft,
  NewExamValidationErrors,
} from "@/features/exams/models/new-exam-draft";
import { getDefaultAcademicYear } from "@/features/exams/services/academic-year";

export function createInitialNewExamDraft(
  date: Date,
  createDraftId: () => string,
): NewExamDraft {
  return {
    title: "",
    academicYear: getDefaultAcademicYear(date),
    level: "",
    subject: DEFAULT_SOCIAL_STUDIES_SUBJECT,
    examNumber: "",
    institution: "",
    teacherName: "",
    durationMinutes: undefined,
    documentLanguage: "ar",
    templateId: DEFAULT_EXAM_TEMPLATE_ID,
    sections: DEFAULT_SOCIAL_STUDIES_SECTIONS.map((title) => ({
      draftId: createDraftId(),
      title,
      subject: title,
    })),
  };
}

export function validateNewExamInformation(
  draft: NewExamDraft,
): NewExamValidationErrors["information"] {
  const errors: NewExamValidationErrors["information"] = {};

  for (const field of ["title", "academicYear", "level", "subject"] as const) {
    if (draft[field].trim() === "") {
      errors[field] = "newExam.validation.required";
    }
  }

  if (
    draft.durationMinutes !== undefined &&
    (!Number.isInteger(draft.durationMinutes) || draft.durationMinutes <= 0)
  ) {
    errors.durationMinutes = "newExam.validation.durationPositive";
  }

  return errors;
}

export function validateNewExamStructure(
  draft: NewExamDraft,
): Pick<NewExamValidationErrors, "sections" | "structure"> {
  if (draft.sections.length === 0) {
    return {
      sections: {},
      structure: "newExam.validation.sectionRequired",
    };
  }

  return {
    sections: Object.fromEntries(
      draft.sections
        .filter((section) => section.title.trim() === "")
        .map((section) => [
          section.draftId,
          "newExam.validation.sectionTitleRequired",
        ]),
    ),
  };
}
