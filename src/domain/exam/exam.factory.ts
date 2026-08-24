import {
  CURRENT_EXAM_SCHEMA_VERSION,
  type DocumentLanguage,
  type Exam,
  type ExamId,
} from "@/domain/exam/exam.types";
import { DEFAULT_QUESTION_NUMBERING_SETTINGS } from "@/domain/exam/exam.question-numbering";

export const DEFAULT_EXAM_TEMPLATE_ID = "default";

export interface CreateEmptyExamInput {
  id: ExamId;
  now: string;
  documentLanguage: DocumentLanguage;
  templateId?: string;
}

export function createEmptyExam({
  id,
  now,
  documentLanguage,
  templateId = DEFAULT_EXAM_TEMPLATE_ID,
}: CreateEmptyExamInput): Exam {
  return {
    schemaVersion: CURRENT_EXAM_SCHEMA_VERSION,
    id,
    metadata: {
      title: "",
      academicYear: "",
      level: "",
      subject: "",
    },
    studentFields: {
      showFullName: true,
      showStudentNumber: true,
      showClassName: true,
      showGrade: true,
    },
    sections: [],
    settings: {
      documentLanguage,
      templateId,
      showTotalPoints: true,
      questionNumbering: { ...DEFAULT_QUESTION_NUMBERING_SETTINGS },
    },
    createdAt: now,
    updatedAt: now,
  };
}
