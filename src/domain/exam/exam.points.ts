import type { ExamBlock } from "@/domain/exam/blocks.types";
import type { Exam, ExamSection } from "@/domain/exam/exam.types";

function normalizePointTotal(total: number): number {
  return Number(total.toFixed(10));
}

function sumDefinedPoints(values: ReadonlyArray<number | undefined>): number {
  return normalizePointTotal(
    values.reduce<number>((total, value) => total + (value ?? 0), 0),
  );
}

export function calculateBlockPoints(block: ExamBlock): number {
  if (block.points !== undefined) {
    return block.points;
  }

  if (block.type === "definition") {
    return sumDefinedPoints(block.items.map((item) => item.points));
  }

  if (block.type === "true-false") {
    return sumDefinedPoints(
      block.statements.map((statement) => statement.points),
    );
  }

  return 0;
}

export function calculateSectionPoints(section: ExamSection): number {
  return normalizePointTotal(
    section.blocks.reduce(
      (total, block) => total + calculateBlockPoints(block),
      0,
    ),
  );
}

export function calculateExamPoints(exam: Exam): number {
  return normalizePointTotal(
    exam.sections.reduce(
      (total, section) => total + calculateSectionPoints(section),
      0,
    ),
  );
}
