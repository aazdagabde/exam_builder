import type { ExamBlockType } from "@/domain/exam/blocks.types";
import type { BlockId } from "@/domain/exam/blocks.types";
import type { Exam, QuestionNumberingSettings } from "@/domain/exam/exam.types";

export const DEFAULT_QUESTION_NUMBERING_SETTINGS = {
  enabled: true,
  restartPerSection: true,
} as const satisfies QuestionNumberingSettings;

const INELIGIBLE_TYPES = new Set<ExamBlockType>(["separator", "page-break"]);

const DEFAULT_NUMBERED_TYPES = new Set<ExamBlockType>([
  "question",
  "definition",
  "true-false",
  "multiple-choice",
  "fill-blank",
  "table",
  "matching",
  "timeline",
  "chart",
  "essay",
]);

export function canBlockStartQuestion(type: ExamBlockType): boolean {
  return !INELIGIBLE_TYPES.has(type);
}

export function getDefaultStartsNewQuestion(type: ExamBlockType): boolean {
  return DEFAULT_NUMBERED_TYPES.has(type);
}

export function getQuestionNumberingSettings(
  exam: Exam,
): QuestionNumberingSettings {
  return exam.settings.questionNumbering;
}

/** Derives question numbers in one deterministic O(n) pass without mutation. */
export function computeQuestionNumbering(
  exam: Exam,
): ReadonlyMap<BlockId, number> {
  const settings = getQuestionNumberingSettings(exam);
  const result = new Map<BlockId, number>();
  if (!settings.enabled) return result;

  let questionNumber = 0;
  for (const section of exam.sections) {
    if (settings.restartPerSection) questionNumber = 0;
    for (const block of section.blocks) {
      if (canBlockStartQuestion(block.type) && block.startsNewQuestion) {
        questionNumber += 1;
        result.set(block.id, questionNumber);
      }
    }
  }
  return result;
}
