import type { PaginationUnit } from "@/features/exam-renderer/pagination/pagination.types";

function isTableRowUnit(unit: PaginationUnit): unit is Extract<
  PaginationUnit,
  { kind: "block" }
> & {
  fragment: Extract<
    Extract<PaginationUnit, { kind: "block" }>["fragment"],
    { kind: "table" }
  >;
} {
  return unit.kind === "block" && unit.fragment.kind === "table";
}

export function mergePageUnitsForRender(
  units: PaginationUnit[],
): PaginationUnit[] {
  const merged: PaginationUnit[] = [];

  for (const unit of units) {
    const previous = merged.at(-1);
    if (
      isTableRowUnit(unit) &&
      previous &&
      isTableRowUnit(previous) &&
      previous.block.id === unit.block.id
    ) {
      merged[merged.length - 1] = {
        ...previous,
        id: `${previous.id}..${unit.id}`,
        fragment: {
          kind: "table",
          rows: [...previous.fragment.rows, ...unit.fragment.rows],
          showPoints: previous.fragment.showPoints || unit.fragment.showPoints,
          showQuestionNumber:
            previous.fragment.showQuestionNumber ||
            unit.fragment.showQuestionNumber,
        },
        estimatedHeight: previous.estimatedHeight + unit.estimatedHeight,
      };
      continue;
    }
    merged.push(unit);
  }

  return merged;
}
