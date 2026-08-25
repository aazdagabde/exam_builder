import type { ExamBlock } from "@/domain/exam/blocks.types";
import { calculateExamPoints } from "@/domain/exam/exam.points";
import { diagramHasCycle, isDiagramTooDense } from "@/domain/exam/exam.diagram";
import {
  computeTimelineEventPositions,
  getTimelineTickCount,
  isValidTimelineScale,
  MAX_TIMELINE_TICKS,
} from "@/domain/exam/exam.timeline";
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
  TIMELINE_EMPTY: "TIMELINE_EMPTY",
  TIMELINE_SCALE_INVALID: "TIMELINE_SCALE_INVALID",
  TIMELINE_EVENT_OUT_OF_RANGE: "TIMELINE_EVENT_OUT_OF_RANGE",
  TIMELINE_EVENT_POSITION_MISSING: "TIMELINE_EVENT_POSITION_MISSING",
  TIMELINE_TOO_MANY_TICKS: "TIMELINE_TOO_MANY_TICKS",
  TIMELINE_HORIZONTAL_TOO_DENSE: "TIMELINE_HORIZONTAL_TOO_DENSE",
  TIMELINE_PERIOD_OUT_OF_RANGE: "TIMELINE_PERIOD_OUT_OF_RANGE",
  CHART_EMPTY: "CHART_EMPTY",
  CHART_PIE_MULTIPLE_SERIES: "CHART_PIE_MULTIPLE_SERIES",
  CHART_PIE_NEGATIVE_VALUES: "CHART_PIE_NEGATIVE_VALUES",
  DIAGRAM_EMPTY: "DIAGRAM_EMPTY",
  DIAGRAM_EMPTY_NODE: "DIAGRAM_EMPTY_NODE",
  DIAGRAM_INVALID_EDGE: "DIAGRAM_INVALID_EDGE",
  DIAGRAM_CYCLE: "DIAGRAM_CYCLE",
  DIAGRAM_TOO_DENSE: "DIAGRAM_TOO_DENSE",
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
  TIMELINE_EMPTY: "validation.timeline.empty",
  TIMELINE_SCALE_INVALID: "validation.timeline.scaleInvalid",
  TIMELINE_EVENT_OUT_OF_RANGE: "validation.timeline.eventOutOfRange",
  TIMELINE_EVENT_POSITION_MISSING: "validation.timeline.positionMissing",
  TIMELINE_TOO_MANY_TICKS: "validation.timeline.tooManyTicks",
  TIMELINE_HORIZONTAL_TOO_DENSE: "validation.timeline.tooDense",
  TIMELINE_PERIOD_OUT_OF_RANGE: "validation.timeline.periodOutOfRange",
  CHART_EMPTY: "validation.chart.empty",
  CHART_PIE_MULTIPLE_SERIES: "validation.chart.pieMultipleSeries",
  CHART_PIE_NEGATIVE_VALUES: "validation.chart.pieNegativeValues",
  DIAGRAM_EMPTY: "validation.diagram.empty",
  DIAGRAM_EMPTY_NODE: "validation.diagram.emptyNode",
  DIAGRAM_INVALID_EDGE: "validation.diagram.invalidEdge",
  DIAGRAM_CYCLE: "validation.diagram.cycle",
  DIAGRAM_TOO_DENSE: "validation.diagram.tooDense",
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

    case "timeline":
      if (
        block.events.every(
          (event) =>
            !event.date.trim() &&
            !event.label.trim() &&
            !(event.description ?? "").trim(),
        )
      ) {
        issues.push(
          createIssue(ExamValidationCode.TIMELINE_EMPTY, "warning", {
            ...context,
            path: `${blockPath}.events`,
          }),
        );
      }
      if (block.spacingMode === "scaled") {
        if (!isValidTimelineScale(block.scale)) {
          issues.push(
            createIssue(ExamValidationCode.TIMELINE_SCALE_INVALID, "warning", {
              ...context,
              path: `${blockPath}.scale`,
            }),
          );
          break;
        }
        const scale = block.scale;
        if (getTimelineTickCount(scale) > MAX_TIMELINE_TICKS) {
          issues.push(
            createIssue(ExamValidationCode.TIMELINE_TOO_MANY_TICKS, "warning", {
              ...context,
              path: `${blockPath}.scale.step`,
            }),
          );
        }
        block.events.forEach((event, eventIndex) => {
          if (event.axisValue === null) {
            issues.push(
              createIssue(
                ExamValidationCode.TIMELINE_EVENT_POSITION_MISSING,
                "warning",
                {
                  ...context,
                  path: `${blockPath}.events.${eventIndex}.axisValue`,
                },
              ),
            );
          } else if (
            event.axisValue < scale.start ||
            event.axisValue > scale.end
          ) {
            issues.push(
              createIssue(
                ExamValidationCode.TIMELINE_EVENT_OUT_OF_RANGE,
                "warning",
                {
                  ...context,
                  path: `${blockPath}.events.${eventIndex}.axisValue`,
                },
              ),
            );
          }
        });
        block.periods.forEach((period, periodIndex) => {
          if (
            period.startValue >= period.endValue ||
            period.startValue < scale.start ||
            period.endValue > scale.end
          ) {
            issues.push(
              createIssue(
                ExamValidationCode.TIMELINE_PERIOD_OUT_OF_RANGE,
                "warning",
                {
                  ...context,
                  path: `${blockPath}.periods.${periodIndex}`,
                },
              ),
            );
          }
        });
        const { tooDense } = computeTimelineEventPositions({
          events: block.events,
          scale,
          direction: block.chronologyDirection,
          left: 55,
          right: 945,
          scaled: true,
        });
        if (
          tooDense &&
          block.orientation === "horizontal" &&
          block.timelineStyle === "historical"
        ) {
          issues.push(
            createIssue(
              ExamValidationCode.TIMELINE_HORIZONTAL_TOO_DENSE,
              "warning",
              { ...context, path: `${blockPath}.events` },
            ),
          );
        }
      }
      break;

    case "chart": {
      const values = block.series.flatMap((series) => series.values);
      if (
        block.labels.length === 0 ||
        block.series.length === 0 ||
        values.every((value) => value === null)
      ) {
        issues.push(
          createIssue(ExamValidationCode.CHART_EMPTY, "warning", {
            ...context,
            path: `${blockPath}.series`,
          }),
        );
      }
      if (block.chartType === "pie" && block.series.length > 1) {
        issues.push(
          createIssue(ExamValidationCode.CHART_PIE_MULTIPLE_SERIES, "warning", {
            ...context,
            path: `${blockPath}.series`,
          }),
        );
      }
      if (
        block.chartType === "pie" &&
        values.some((value) => value !== null && value < 0)
      ) {
        issues.push(
          createIssue(ExamValidationCode.CHART_PIE_NEGATIVE_VALUES, "warning", {
            ...context,
            path: `${blockPath}.series`,
          }),
        );
      }
      break;
    }

    case "diagram": {
      const nodeIds = new Set(block.nodes.map((node) => node.id));
      if (block.nodes.length === 0 || block.edges.length === 0) {
        issues.push(
          createIssue(ExamValidationCode.DIAGRAM_EMPTY, "warning", {
            ...context,
            path: `${blockPath}.nodes`,
          }),
        );
      }
      block.nodes.forEach((node, nodeIndex) => {
        if (!node.text.trim()) {
          issues.push(
            createIssue(ExamValidationCode.DIAGRAM_EMPTY_NODE, "warning", {
              ...context,
              path: `${blockPath}.nodes.${nodeIndex}.text`,
            }),
          );
        }
      });
      const relations = new Set<string>();
      block.edges.forEach((edge, edgeIndex) => {
        const relation = JSON.stringify([
          edge.fromNodeId,
          edge.toNodeId,
          edge.label,
        ]);
        const invalid =
          !nodeIds.has(edge.fromNodeId) ||
          !nodeIds.has(edge.toNodeId) ||
          edge.fromNodeId === edge.toNodeId ||
          relations.has(relation);
        if (invalid) {
          issues.push(
            createIssue(ExamValidationCode.DIAGRAM_INVALID_EDGE, "warning", {
              ...context,
              path: `${blockPath}.edges.${edgeIndex}`,
            }),
          );
        }
        relations.add(relation);
      });
      if (block.layout === "hierarchy" && diagramHasCycle(block)) {
        issues.push(
          createIssue(ExamValidationCode.DIAGRAM_CYCLE, "warning", {
            ...context,
            path: `${blockPath}.edges`,
          }),
        );
      }
      if (isDiagramTooDense(block)) {
        issues.push(
          createIssue(ExamValidationCode.DIAGRAM_TOO_DENSE, "warning", {
            ...context,
            path: `${blockPath}.nodes`,
          }),
        );
      }
      break;
    }
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
