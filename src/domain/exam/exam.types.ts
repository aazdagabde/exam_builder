import type { ExamBlock } from "@/domain/exam/blocks.types";

/** Immutable version markers used by historical migration steps. */
export const EXAM_SCHEMA_VERSION_1 = 1 as const;
export const EXAM_SCHEMA_VERSION_2 = 2 as const;
export const EXAM_SCHEMA_VERSION_3 = 3 as const;
export const EXAM_SCHEMA_VERSION_4 = 4 as const;

/** The only Exam schema version accepted by the runtime Domain. */
export const CURRENT_EXAM_SCHEMA_VERSION = EXAM_SCHEMA_VERSION_4;

export type ExamId = string;
export type SectionId = string;
export type DocumentLanguage = "ar" | "fr";
export type DocumentDirection = "rtl" | "ltr";

export interface ExamMetadata {
  title: string;
  academicYear: string;
  institution?: string;
  regionalAcademy?: string;
  provincialDirectorate?: string;
  level: string;
  subject: string;
  teacherName?: string;
  durationMinutes?: number;
  /** Declared target total; it is never added to calculated block points. */
  totalPoints?: number;
  examNumber?: string;
}

export interface StudentFieldsSettings {
  showFullName: boolean;
  showStudentNumber: boolean;
  showClassName: boolean;
  showGrade: boolean;
}

export interface ExamSettings {
  /** This is the document language, independent from the application UI language. */
  documentLanguage: DocumentLanguage;
  templateId: string;
  showTotalPoints: boolean;
  questionNumbering: QuestionNumberingSettings;
}

export interface QuestionNumberingSettings {
  enabled: boolean;
  restartPerSection: boolean;
}

export interface ExamSection {
  id: SectionId;
  title: string;
  subject?: string;
  /** A declared section total, not an additional score in point calculations. */
  points?: number;
  blocks: ExamBlock[];
}

export interface Exam {
  schemaVersion: typeof CURRENT_EXAM_SCHEMA_VERSION;
  id: ExamId;
  metadata: ExamMetadata;
  studentFields: StudentFieldsSettings;
  sections: ExamSection[];
  settings: ExamSettings;
  createdAt: string;
  updatedAt: string;
}
