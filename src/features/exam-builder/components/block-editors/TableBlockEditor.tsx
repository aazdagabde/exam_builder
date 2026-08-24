import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addTableColumn,
  addTableRow,
  moveTableColumn,
  moveTableRow,
  removeTableColumn,
  removeTableRow,
  type TableBlock,
} from "@/domain/exam";
import { createBuilderItemId } from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function TableBlockEditor({ block }: { block: TableBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);

  const updateTable = (
    updater: (table: TableBlock) => TableBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "table" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  return (
    <BlockEditorShell type={block.type}>
      <div className="grid gap-4 sm:grid-cols-2">
        <BooleanField
          id={`table-header-${block.id}`}
          label={t("examBuilder.blocks.table.showHeader")}
          checked={block.showHeader}
          onCheckedChange={(showHeader) =>
            updateTable((table) => ({ ...table, showHeader }))
          }
        />
        <BlockPointsField blockId={block.id} value={block.points} />
      </div>

      <section
        className="space-y-3"
        aria-labelledby={`table-columns-${block.id}`}
      >
        <h4 id={`table-columns-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.table.columns")}
        </h4>
        <ol className="space-y-3">
          {block.columns.map((column, index) => {
            const name = t("examBuilder.blocks.table.columnNumber", {
              number: index + 1,
            });
            const historyKey = `block:${block.id}:column:${column.id}:label`;
            return (
              <li
                key={column.id}
                className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor={`table-column-${column.id}`}>{name}</Label>
                  <Input
                    id={`table-column-${column.id}`}
                    dir="auto"
                    value={column.label}
                    placeholder={t(
                      "examBuilder.blocks.table.columnPlaceholder",
                    )}
                    onChange={(event) =>
                      updateTable(
                        (table) => ({
                          ...table,
                          columns: table.columns.map((candidate) =>
                            candidate.id === column.id
                              ? { ...candidate, label: event.target.value }
                              : candidate,
                          ),
                        }),
                        historyKey,
                      )
                    }
                    onBlur={() => endHistoryGroup(historyKey)}
                  />
                </div>
                <ItemActions
                  name={name}
                  index={index}
                  count={block.columns.length}
                  removeDisabled={block.columns.length === 1}
                  onMoveUp={() =>
                    updateTable((table) =>
                      moveTableColumn(table, column.id, -1),
                    )
                  }
                  onMoveDown={() =>
                    updateTable((table) => moveTableColumn(table, column.id, 1))
                  }
                  onRemove={() =>
                    updateTable((table) => removeTableColumn(table, column.id))
                  }
                />
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateTable((table) => addTableColumn(table, createBuilderItemId()))
          }
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.table.addColumn")}
        </Button>
      </section>

      <section className="space-y-3" aria-labelledby={`table-rows-${block.id}`}>
        <h4 id={`table-rows-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.table.rows")}
        </h4>
        {block.rows.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("examBuilder.blocks.table.emptyRows")}
          </p>
        ) : null}
        <ol className="space-y-3">
          {block.rows.map((row, rowIndex) => {
            const rowName = t("examBuilder.blocks.table.rowNumber", {
              number: rowIndex + 1,
            });
            return (
              <li key={row.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold">{rowName}</h5>
                  <ItemActions
                    name={rowName}
                    index={rowIndex}
                    count={block.rows.length}
                    onMoveUp={() =>
                      updateTable((table) => moveTableRow(table, row.id, -1))
                    }
                    onMoveDown={() =>
                      updateTable((table) => moveTableRow(table, row.id, 1))
                    }
                    onRemove={() =>
                      updateTable((table) => removeTableRow(table, row.id))
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {block.columns.map((column, columnIndex) => {
                    const cell = row.cells.find(
                      (candidate) => candidate.columnId === column.id,
                    );
                    const historyKey = `block:${block.id}:row:${row.id}:column:${column.id}`;
                    const label = t("examBuilder.blocks.table.cellLabel", {
                      row: rowIndex + 1,
                      column: column.label || columnIndex + 1,
                    });
                    return (
                      <div key={column.id} className="space-y-2">
                        <Label htmlFor={`table-cell-${row.id}-${column.id}`}>
                          {label}
                        </Label>
                        <Input
                          id={`table-cell-${row.id}-${column.id}`}
                          dir="auto"
                          value={cell?.value ?? ""}
                          onChange={(event) =>
                            updateTable(
                              (table) => ({
                                ...table,
                                rows: table.rows.map((candidateRow) =>
                                  candidateRow.id === row.id
                                    ? {
                                        ...candidateRow,
                                        cells: candidateRow.cells.map(
                                          (candidateCell) =>
                                            candidateCell.columnId === column.id
                                              ? {
                                                  ...candidateCell,
                                                  value: event.target.value,
                                                }
                                              : candidateCell,
                                        ),
                                      }
                                    : candidateRow,
                                ),
                              }),
                              historyKey,
                            )
                          }
                          onBlur={() => endHistoryGroup(historyKey)}
                        />
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateTable((table) => addTableRow(table, createBuilderItemId()))
          }
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.table.addRow")}
        </Button>
      </section>
    </BlockEditorShell>
  );
}
