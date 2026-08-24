// @vitest-environment node

import {
  addTableColumn,
  addTableRow,
  ExamBlockSchema,
  moveTableColumn,
  moveTableRow,
  removeTableColumn,
  removeTableRow,
  type TableBlock,
} from "@/domain/exam";

function table(): TableBlock {
  return {
    id: "table",
    type: "table",
    startsNewQuestion: true,
    order: 0,
    columns: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ],
    rows: [
      {
        id: "row-1",
        cells: [
          { columnId: "a", value: "A1" },
          { columnId: "b", value: "B1" },
          { columnId: "c", value: "C1" },
        ],
      },
    ],
    showHeader: true,
  };
}

describe("Table block operations", () => {
  it("adds a column and creates one matching cell in every row", () => {
    const result = addTableColumn(table(), "d");

    expect(result.columns.at(-1)).toEqual({ id: "d", label: "" });
    expect(result.rows[0]?.cells.at(-1)).toEqual({
      columnId: "d",
      value: "",
    });
    expect(ExamBlockSchema.safeParse(result).success).toBe(true);
  });

  it("removes a column and every corresponding cell", () => {
    const result = removeTableColumn(table(), "a");

    expect(result.columns.map((column) => column.id)).toEqual(["b", "c"]);
    expect(result.rows[0]?.cells).toEqual([
      { columnId: "b", value: "B1" },
      { columnId: "c", value: "C1" },
    ]);
  });

  it("protects the last structural column", () => {
    const source = removeTableColumn(removeTableColumn(table(), "c"), "b");
    expect(removeTableColumn(source, "a")).toBe(source);
    expect(source.columns).toHaveLength(1);
  });

  it("reorders columns and realigns cells without losing values", () => {
    let result = moveTableColumn(table(), "c", -1);
    result = moveTableColumn(result, "c", -1);

    expect(result.columns.map((column) => column.id)).toEqual(["c", "a", "b"]);
    expect(result.rows[0]?.cells).toEqual([
      { columnId: "c", value: "C1" },
      { columnId: "a", value: "A1" },
      { columnId: "b", value: "B1" },
    ]);
  });

  it("adds, reorders and removes structurally complete rows", () => {
    let result = addTableRow(table(), "row-2");
    expect(result.rows[1]).toEqual({
      id: "row-2",
      cells: [
        { columnId: "a", value: "" },
        { columnId: "b", value: "" },
        { columnId: "c", value: "" },
      ],
    });

    result = moveTableRow(result, "row-2", -1);
    expect(result.rows.map((row) => row.id)).toEqual(["row-2", "row-1"]);
    result = removeTableRow(result, "row-1");
    expect(result.rows.map((row) => row.id)).toEqual(["row-2"]);
    result = removeTableRow(result, "row-2");
    expect(result.rows).toEqual([]);
    expect(ExamBlockSchema.safeParse(result).success).toBe(true);
  });
});
