import type { TableBlock } from "@/domain/exam";

const MIN_COLUMN_WEIGHT = 8;
const MAX_COLUMN_WEIGHT = 24;

function contentLength(value: string): number {
  return value.replace(/\s+/g, " ").trim().length;
}

export function calculateTableColumnPercentages(block: TableBlock): number[] {
  if (block.columns.length === 0) return [];
  const weights = block.columns.map((column) => {
    const values = block.rows.map(
      (row) =>
        row.cells.find((cell) => cell.columnId === column.id)?.value ?? "",
    );
    const longest = Math.max(
      contentLength(column.label),
      ...values.map(contentLength),
    );
    return Math.min(MAX_COLUMN_WEIGHT, Math.max(MIN_COLUMN_WEIGHT, longest));
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (weight / total) * 100);
}
