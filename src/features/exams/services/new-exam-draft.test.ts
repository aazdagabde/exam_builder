// @vitest-environment node

import {
  DEFAULT_EXAM_TEMPLATE_ID,
  DEFAULT_SOCIAL_STUDIES_SECTIONS,
  DEFAULT_SOCIAL_STUDIES_SUBJECT,
} from "@/features/exams/constants/new-exam";
import {
  createInitialNewExamDraft,
  validateNewExamInformation,
} from "@/features/exams/services/new-exam-draft";

describe("createInitialNewExamDraft", () => {
  it("provides the Moroccan social studies defaults without choosing a level", () => {
    let nextId = 0;
    const draft = createInitialNewExamDraft(
      new Date(2026, 7, 22),
      () => `draft-${++nextId}`,
    );

    expect(draft).toMatchObject({
      title: "",
      level: "",
      subject: DEFAULT_SOCIAL_STUDIES_SUBJECT,
      academicYear: "2026-2027",
      documentLanguage: "ar",
      templateId: DEFAULT_EXAM_TEMPLATE_ID,
    });
    expect(draft.sections.map((section) => section.title)).toEqual(
      DEFAULT_SOCIAL_STUDIES_SECTIONS,
    );
    expect(new Set(draft.sections.map((section) => section.draftId)).size).toBe(
      3,
    );
  });

  it("rejects a fractional duration before Domain construction", () => {
    const draft = createInitialNewExamDraft(new Date(2026, 7, 22), () =>
      crypto.randomUUID(),
    );

    expect(
      validateNewExamInformation({
        ...draft,
        title: "Contrôle",
        level: "الثالثة إعدادي",
        durationMinutes: 1.5,
      }),
    ).toMatchObject({
      durationMinutes: "newExam.validation.durationPositive",
    });
  });
});
