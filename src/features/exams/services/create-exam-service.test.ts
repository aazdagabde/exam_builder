// @vitest-environment node

import { CURRENT_EXAM_SCHEMA_VERSION, ExamSchema } from "@/domain/exam";
import type { NewExamDraft } from "@/features/exams/models/new-exam-draft";
import { createExamFromDraft } from "@/features/exams/services/create-exam-service";

const NOW = "2026-08-22T10:00:00.000Z";

function createDraft(): NewExamDraft {
  return {
    title: "  فرض محروس رقم 1  ",
    academicYear: "2026-2027",
    level: "الثالثة إعدادي",
    subject: "الاجتماعيات",
    examNumber: " 1 ",
    institution: " مؤسسة الأمل ",
    teacherName: " الأستاذة سلمى ",
    durationMinutes: 60,
    documentLanguage: "ar",
    templateId: "moroccan-college-classic",
    sections: [
      { draftId: "draft-1", title: " التاريخ ", subject: "التاريخ" },
      { draftId: "draft-2", title: "الجغرافيا" },
      { draftId: "draft-3", title: "المواطنة" },
    ],
  };
}

describe("createExamFromDraft", () => {
  it("creates a schema-valid Exam from UI input and Domain defaults", () => {
    let nextSection = 0;
    const exam = createExamFromDraft(createDraft(), {
      examId: "exam-new",
      now: NOW,
      createSectionId: () => `section-${++nextSection}`,
    });

    expect(ExamSchema.parse(exam)).toEqual(exam);
    expect(exam).toMatchObject({
      schemaVersion: CURRENT_EXAM_SCHEMA_VERSION,
      id: "exam-new",
      createdAt: NOW,
      updatedAt: NOW,
      metadata: {
        title: "فرض محروس رقم 1",
        academicYear: "2026-2027",
        level: "الثالثة إعدادي",
        subject: "الاجتماعيات",
        examNumber: "1",
        institution: "مؤسسة الأمل",
        teacherName: "الأستاذة سلمى",
        durationMinutes: 60,
        totalPoints: 20,
      },
      settings: {
        documentLanguage: "ar",
        templateId: "moroccan-college-classic",
        showTotalPoints: true,
      },
      studentFields: {
        showFullName: true,
        showStudentNumber: true,
        showClassName: true,
        showGrade: true,
      },
    });
    expect(exam.sections.map((section) => section.id)).toEqual([
      "section-1",
      "section-2",
      "section-3",
    ]);
    expect(new Set(exam.sections.map((section) => section.id)).size).toBe(3);
    expect(exam.sections.every((section) => section.blocks.length === 0)).toBe(
      true,
    );
  });
});
