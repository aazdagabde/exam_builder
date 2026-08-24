import type { DocumentLanguage } from "@/domain/exam";

export interface NewExamSectionDraft {
  draftId: string;
  title: string;
  subject?: string;
}

export interface NewExamDraft {
  title: string;
  academicYear: string;
  level: string;
  subject: string;
  examNumber: string;
  institution: string;
  teacherName: string;
  durationMinutes?: number;
  documentLanguage: DocumentLanguage;
  templateId: string;
  sections: NewExamSectionDraft[];
}

export type NewExamInformationField =
  "title" | "academicYear" | "level" | "subject" | "durationMinutes";

export interface NewExamValidationErrors {
  information: Partial<Record<NewExamInformationField, string>>;
  sections: Record<string, string>;
  structure?: string;
}
