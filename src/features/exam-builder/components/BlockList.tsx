import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { computeQuestionNumbering, type ExamBlock } from "@/domain/exam";
import { getBlockCatalogEntry } from "@/features/exam-builder/blocks/block-catalog";
import {
  getBlockSummary,
  type BlockSummary,
} from "@/features/exam-builder/blocks/block-summary";
import { DeleteBlockDialog } from "@/features/exam-builder/components/DeleteBlockDialog";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";
import { cn } from "@/lib/utils";

export function BlockList() {
  const { t } = useTranslation();
  const exam = useExamBuilderStore((state) => state.exam);
  const selectedSectionId = useExamBuilderStore(
    (state) => state.selectedSectionId,
  );
  const blocks =
    exam?.sections.find((section) => section.id === selectedSectionId)
      ?.blocks ?? [];
  const questionNumbers = useMemo(
    () => (exam ? computeQuestionNumbering(exam) : new Map<string, number>()),
    [exam],
  );
  const reorderBlocks = useExamBuilderStore((state) => state.reorderBlocks);
  const deleteBlock = useExamBuilderStore((state) => state.deleteBlock);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      reorderBlocks(String(active.id), String(over.id));
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-5 text-center text-sm text-muted-foreground">
        {t("examBuilder.blocks.empty")}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="space-y-2" aria-label={t("examBuilder.blocks.list")}>
            {blocks.map((block, index) => (
              <SortableBlockItem
                key={block.id}
                block={block}
                index={index}
                count={blocks.length}
                questionNumber={questionNumbers.get(block.id)}
                onRequestDelete={setBlockToDelete}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <DeleteBlockDialog
        open={blockToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setBlockToDelete(null);
        }}
        onConfirm={() => {
          if (blockToDelete !== null) {
            deleteBlock(blockToDelete);
            setBlockToDelete(null);
          }
        }}
      />
    </>
  );
}

function SortableBlockItem({
  block,
  index,
  count,
  questionNumber,
  onRequestDelete,
}: {
  block: ExamBlock;
  index: number;
  count: number;
  questionNumber?: number;
  onRequestDelete(id: string): void;
}) {
  const { t } = useTranslation();
  const selected = useExamBuilderStore(
    (state) => state.selectedBlockId === block.id,
  );
  const selectBlock = useExamBuilderStore((state) => state.selectBlock);
  const duplicateBlock = useExamBuilderStore((state) => state.duplicateBlock);
  const moveBlock = useExamBuilderStore((state) => state.moveBlock);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  const entry = getBlockCatalogEntry(block.type);
  const label = t(entry.labelKey);
  const summary = getBlockSummary(block);
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "rounded-lg border bg-background p-1.5 shadow-sm transition-colors",
        selected && "border-primary bg-accent/50 ring-1 ring-primary/30",
        !selected && "hover:border-muted-foreground/40 hover:bg-muted/30",
        isDragging && "z-10 opacity-70 shadow-lg",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="cursor-grab touch-none active:cursor-grabbing"
          aria-label={t("examBuilder.blocks.actions.drag", { name: label })}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
        </Button>
        <button
          type="button"
          className="min-w-32 flex-1 rounded-md px-1 py-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => selectBlock(block.id)}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {questionNumber !== undefined ? (
              <span
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                dir="ltr"
                aria-label={t("examBuilder.blocks.questionNumber", {
                  number: questionNumber,
                })}
              >
                {questionNumber}
              </span>
            ) : null}
            <entry.icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
            {block.points !== undefined ? (
              <span className="ms-auto shrink-0 text-xs font-normal text-muted-foreground">
                {t("examBuilder.blocks.pointsCompact", {
                  points: block.points,
                })}
              </span>
            ) : null}
          </span>
          <span
            className="mt-1 block truncate text-xs text-muted-foreground"
            dir={summary.kind === "text" ? "auto" : undefined}
          >
            <TranslatedSummary summary={summary} />
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === 0}
            aria-label={t("examBuilder.blocks.actions.moveUp", { name: label })}
            title={t("examBuilder.blocks.actions.moveUp", { name: label })}
            onClick={() => moveBlock(block.id, "up")}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === count - 1}
            aria-label={t("examBuilder.blocks.actions.moveDown", {
              name: label,
            })}
            title={t("examBuilder.blocks.actions.moveDown", { name: label })}
            onClick={() => moveBlock(block.id, "down")}
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={block.type === "essay"}
            aria-label={t("examBuilder.blocks.actions.duplicate", {
              name: label,
            })}
            title={
              block.type === "essay"
                ? t("examBuilder.blocks.essayLimit")
                : t("examBuilder.blocks.actions.duplicate", { name: label })
            }
            onClick={() => duplicateBlock(block.id)}
          >
            <Copy aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label={t("examBuilder.blocks.actions.delete", { name: label })}
            title={t("examBuilder.blocks.actions.delete", { name: label })}
            onClick={() => onRequestDelete(block.id)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function TranslatedSummary({ summary }: { summary: BlockSummary }) {
  const { t } = useTranslation();
  switch (summary.kind) {
    case "text":
      return summary.text;
    case "count":
      return t(`examBuilder.blocks.summary.${summary.item}`, {
        count: summary.count,
      });
    case "table":
      return t("examBuilder.blocks.summary.table", {
        columns: summary.columns,
        rows: summary.rows,
      });
    case "chart":
      return t("examBuilder.blocks.summary.chart", {
        type: t(`examBuilder.blocks.chart.types.${summary.chartType}`),
        count: summary.categories,
      });
    case "none":
      return t("examBuilder.blocks.noContent");
  }
}
