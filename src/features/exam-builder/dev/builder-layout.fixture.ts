import type { Exam, ExamBlockType } from "@/domain/exam";
import { createRendererReferenceExam } from "@/features/exam-renderer/fixtures/reference-exam.fixtures";

const FIXTURE_ID_PATTERN =
  /^builder-layout-reference-(ar|fr)-(definition|table|matching|image)$/;

function focusBlock(exam: Exam, type: ExamBlockType): Exam {
  const sectionIndex = exam.sections.findIndex((section) =>
    section.blocks.some((block) => block.type === type),
  );
  if (sectionIndex < 0) return exam;

  const sections = [...exam.sections];
  const [section] = sections.splice(sectionIndex, 1);
  if (!section) return exam;
  const blockIndex = section.blocks.findIndex((block) => block.type === type);
  const blocks = [...section.blocks];
  const [block] = blocks.splice(blockIndex, 1);
  if (!block) return exam;

  return {
    ...exam,
    sections: [
      {
        ...section,
        blocks: [block, ...blocks].map((candidate, order) => ({
          ...candidate,
          order,
        })),
      },
      ...sections,
    ],
  };
}

export function createBuilderLayoutReferenceExam(examId: string): Exam | null {
  const match = FIXTURE_ID_PATTERN.exec(examId);
  if (!match) return null;
  const language = match[1] === "fr" ? "fr" : "ar";
  const focus = match[2] as ExamBlockType;
  const source = focusBlock(createRendererReferenceExam(language), focus);

  return {
    ...source,
    id: examId,
    metadata: {
      ...source.metadata,
      title:
        language === "ar"
          ? "فرض محروس رقم 2 الأسدوس الثاني — الاجتماعيات"
          : "Devoir surveillé n° 2 du second semestre — Histoire-Géographie",
    },
  };
}
