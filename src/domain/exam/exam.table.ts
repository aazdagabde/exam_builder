import type {
  TableBlock,
  TableColumn,
  TableRow,
} from "@/domain/exam/blocks.types";

function alignCellsWithColumns(
  row: TableRow,
  columns: readonly TableColumn[],
): TableRow {
  const cellsByColumn = new Map(
    row.cells.map((cell) => [cell.columnId, cell] as const),
  );
  return {
    ...row,
    cells: columns.map(
      (column) =>
        cellsByColumn.get(column.id) ?? { columnId: column.id, value: "" },
    ),
  };
}

export function alignTableRows(block: TableBlock): TableBlock {
  return {
    ...block,
    rows: block.rows.map((row) => alignCellsWithColumns(row, block.columns)),
  };
}

export function addTableColumn(
  block: TableBlock,
  columnId: string,
): TableBlock {
  if (block.columns.some((column) => column.id === columnId)) return block;
  const columns = [...block.columns, { id: columnId, label: "" }];
  return {
    ...block,
    columns,
    rows: block.rows.map((row) => alignCellsWithColumns(row, columns)),
  };
}

export function removeTableColumn(
  block: TableBlock,
  columnId: string,
): TableBlock {
  if (block.columns.length === 1) return block;
  const columns = block.columns.filter((column) => column.id !== columnId);
  if (columns.length === block.columns.length) return block;
  return {
    ...block,
    columns,
    rows: block.rows.map((row) => alignCellsWithColumns(row, columns)),
  };
}

export function moveTableColumn(
  block: TableBlock,
  columnId: string,
  offset: -1 | 1,
): TableBlock {
  const index = block.columns.findIndex((column) => column.id === columnId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= block.columns.length) return block;
  const columns = [...block.columns];
  const [column] = columns.splice(index, 1);
  columns.splice(target, 0, column!);
  return {
    ...block,
    columns,
    rows: block.rows.map((row) => alignCellsWithColumns(row, columns)),
  };
}

export function addTableRow(block: TableBlock, rowId: string): TableBlock {
  if (block.rows.some((row) => row.id === rowId)) return block;
  return {
    ...block,
    rows: [
      ...block.rows,
      {
        id: rowId,
        cells: block.columns.map((column) => ({
          columnId: column.id,
          value: "",
        })),
      },
    ],
  };
}

export function removeTableRow(block: TableBlock, rowId: string): TableBlock {
  const rows = block.rows.filter((row) => row.id !== rowId);
  return rows.length === block.rows.length ? block : { ...block, rows };
}

export function moveTableRow(
  block: TableBlock,
  rowId: string,
  offset: -1 | 1,
): TableBlock {
  const index = block.rows.findIndex((row) => row.id === rowId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= block.rows.length) return block;
  const rows = [...block.rows];
  const [row] = rows.splice(index, 1);
  rows.splice(target, 0, row!);
  return { ...block, rows };
}
