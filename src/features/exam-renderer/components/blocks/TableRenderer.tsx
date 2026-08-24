import type { TableBlock, TableRow } from "@/domain/exam";
import { calculateTableColumnPercentages } from "@/features/exam-renderer/components/blocks/table-layout";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function TableRenderer({
  block,
  rows = block.rows,
  showPoints = true,
  labels,
}: {
  block: TableBlock;
  rows?: TableRow[];
  showPoints?: boolean;
  labels: DocumentLabels;
}) {
  const columnPercentages = calculateTableColumnPercentages(block);
  return (
    <div className="exam-table-wrap" data-table-block-id={block.id}>
      <table className="exam-table">
        <colgroup>
          {block.columns.map((column, index) => (
            <col
              key={column.id}
              style={{ width: `${columnPercentages[index] ?? 0}%` }}
            />
          ))}
        </colgroup>
        {block.showHeader ? (
          <thead>
            <tr>
              {block.columns.map((column) => (
                <th key={column.id} dir="auto">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.cells.some((cell) => !(cell.value ?? "").trim())
                  ? "exam-table-row--answer"
                  : undefined
              }
            >
              {block.columns.map((column) => {
                const cell = row.cells.find(
                  (candidate) => candidate.columnId === column.id,
                );
                return (
                  <td key={column.id} dir="auto">
                    {cell?.value ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {showPoints ? (
        <DocumentPoints points={block.points} labels={labels} />
      ) : null}
    </div>
  );
}
