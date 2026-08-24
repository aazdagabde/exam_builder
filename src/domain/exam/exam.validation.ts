import type { ExamBlock } from "@/domain/exam/blocks.types";
import { calculateExamPoints } from "@/domain/exam/exam.points";
import type { Exam, ExamSection } from "@/domain/exam/exam.types";

export const MAX_ESSAY_BLOCKS_PER_EXAM = 1;
export const DEFAULT_EXPECTED_TOTAL_POINTS = 20;

export const ExamValidationCode = {
  EXAM_TITLE_REQUIRED: "EXAM_TITLE_REQUIRED",
  MULTIPLE_ESSAY_BLOCKS: "MULTIPLE_ESSAY_BLOCKS",
  SECTION_TITLE_MISSING: "SECTION_TITLE_MISSING",
  QUESTION_EMPTY: "QUESTION_EMPTY",
  QUESTION_ANSWER_LINES_REQUIRED: "QUESTION_ANSWER_LINES_REQUIRED",
  QUESTION_ANSWER_LINES_NOT_ALLOWED: "QUESTION_ANSWER_LINES_NOT_ALLOWED",
  DEFINITION_ITEMS_REQUIRED: "DEFINITION_ITEMS_REQUIRED",
  MULTIPLE_CHOICE_OPTIONS_REQUIRED: "MULTIPLE_CHOICE_OPTIONS_REQUIRED",
  TABLE_COLUMNS_REQUIRED: "TABLE_COLUMNS_REQUIRED",
  MATCHING_LEFT_EMPTY: "MATCHING_LEFT_EMPTY",
  MATCHING_RIGHT_EMPTY: "MATCHING_RIGHT_EMPTY",
  TOTAL_POINTS_MISMATCH: "TOTAL_POINTS_MISMATCH",
} as const;

export type ExamValidationCode =
  (typeof ExamValidationCode)[keyof typeof ExamValidationCode];
export type ValidationSeverity = "error" | "warning";

export interface ExamValidationIssue {
  code: ExamValidationCode;
  severity: ValidationSeverity;
  messageKey: string;
  path?: string;
  sectionId?: string;
  blockId?: string;
}

const messageKeys: Record<ExamValidationCode, string> = {
  EXAM_TITLE_REQUIRED: "validation.exam.titleRequired",
  MULTIPLE_ESSAY_BLOCKS: "validation.exam.multipleEssayBlocks",
  SECTION_TITLE_MISSING: "validation.section.titleMissing",
  QUESTION_EMPTY: "validation.question.empty",
  QUESTION_ANSWER_LINES_REQUIRED: "validation.question.answerLinesRequired",
  QUESTION_ANSWER_LINES_NOT_ALLOWED:
    "validation.question.answerLinesNotAllowed",
  DEFINITION_ITEMS_REQUIRED: "validation.definition.itemsRequired",
  MULTIPLE_CHOICE_OPTIONS_REQUIRED: "validation.multipleChoice.optionsRequired",
  TABLE_COLUMNS_REQUIRED: "validation.table.columnsRequired",
  MATCHING_LEFT_EMPTY: "validation.matching.leftEmpty",
  MATCHING_RIGHT_EMPTY: "validation.matching.rightEmpty",
  TOTAL_POINTS_MISMATCH: "validation.exam.totalPointsMismatch",
};

function createIssue(
  code: ExamValidationCode,
  severity: ValidationSeverity,
  context: Pick<ExamValidationIssue, "path" | "sectionId" | "blockId"> = {},
): ExamValidationIssue {
  return {
    code,
    severity,
    messageKey: messageKeys[code],
    ...context,
  };
}

function validateBlock(
  block: ExamBlock,
  section: ExamSection,
  sectionIndex: number,
  blockIndex: number,
): ExamValidationIssue[] {
  const issues: ExamValidationIssue[] = [];
  const blockPath = `sections.${sectionIndex}.blocks.${blockIndex}`;
  const context = { sectionId: section.id, blockId: block.id };

  switch (block.type) {
    case "question":
      if (block.question.trim() === "") {
        issues.push(
          createIssue(ExamValidationCode.QUESTION_EMPTY, "warning", {
            ...context,
            path: `${blockPath}.question`,
          }),
        );
      }

      if (
        block.answerMode === "lines" &&
        (!block.answerLines || block.answerLines <= 0)
      ) {
        issues.push(
          createIssue(
            ExamValidationCode.QUESTION_ANSWER_LINES_REQUIRED,
            "error",
            {
              ...context,
              path: `${blockPath}.answerLines`,
            },
          ),
        );
      }

      if (block.answerMode === "none" && block.answerLines !== undefined) {
        issues.push(
          createIssue(
            ExamValidationCode.QUESTION_ANSWER_LINES_NOT_ALLOWED,
            "error",
            {
              ...context,
              path: `${blockPath}.answerLines`,
            },
          ),
        );
      }
      break;

    case "definition":
      if (block.items.length === 0) {
        issues.push(
          createIssue(ExamValidationCode.DEFINITION_ITEMS_REQUIRED, "error", {
            ...context,
            path: `${blockPath}.items`,
          }),
        );
      }
      break;

    case "multiple-choice":
      if (block.options.length === 0) {
        issues.push(
          createIssue(
            ExamValidationCode.MULTIPLE_CHOICE_OPTIONS_REQUIRED,
            "error",
            {
              ...context,
              path: `${blockPath}.options`,
            },
          ),
        );
      }
      break;

    case "table":
      if (block.columns.length === 0) {
        issues.push(
          createIssue(ExamValidationCode.TABLE_COLUMNS_REQUIRED, "error", {
            ...context,
            path: `${blockPath}.columns`,
          }),
        );
      }
      break;

    case "matching":
      if (block.leftItems.length === 0) {
        issues.push(
          createIssue(ExamValidationCode.MATCHING_LEFT_EMPTY, "warning", {
            ...context,
            path: `${blockPath}.leftItems`,
          }),
        );
      }

      if (block.rightItems.length === 0) {
        issues.push(
          createIssue(ExamValidationCode.MATCHING_RIGHT_EMPTY, "warning", {
            ...context,
            path: `${blockPath}.rightItems`,
          }),
        );
      }
      break;
  }

  return issues;
}

export function validateExam(exam: Exam): ExamValidationIssue[] {
  const issues: ExamValidationIssue[] = [];
  let essayBlockCount = 0;

  if (exam.metadata.title.trim() === "") {
    issues.push(
      createIssue(ExamValidationCode.EXAM_TITLE_REQUIRED, "error", {
        path: "metadata.title",
      }),
    );
  }

  exam.sections.forEach((section, sectionIndex) => {
    if (section.title.trim() === "") {
      issues.push(
        createIssue(ExamValidationCode.SECTION_TITLE_MISSING, "warning", {
          path: `sections.${sectionIndex}.title`,
          sectionId: section.id,
        }),
      );
    }

    section.blocks.forEach((block, blockIndex) => {
      if (block.type === "essay") {
        essayBlockCount += 1;
      }

      issues.push(...validateBlock(block, section, sectionIndex, blockIndex));
    });
  });

  if (essayBlockCount > MAX_ESSAY_BLOCKS_PER_EXAM) {
    issues.push(
      createIssue(ExamValidationCode.MULTIPLE_ESSAY_BLOCKS, "error", {
        path: "sections",
      }),
    );
  }

  const expectedTotal =
    exam.metadata.totalPoints ?? DEFAULT_EXPECTED_TOTAL_POINTS;
  const calculatedTotal = calculateExamPoints(exam);

  if (Math.abs(calculatedTotal - expectedTotal) > Number.EPSILON) {
    issues.push(
      createIssue(ExamValidationCode.TOTAL_POINTS_MISMATCH, "warning", {
        path: "metadata.totalPoints",
      }),
    );
  }

  return issues;
}
