import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";
import { cn } from "@/lib/utils";

export function SectionListItem({
  sectionId,
  onRequestDelete,
}: {
  sectionId: string;
  onRequestDelete(id: string): void;
}) {
  const { t } = useTranslation();
  const section = useExamBuilderStore((state) =>
    state.exam?.sections.find((candidate) => candidate.id === sectionId),
  );
  const index = useExamBuilderStore(
    (state) =>
      state.exam?.sections.findIndex(
        (candidate) => candidate.id === sectionId,
      ) ?? -1,
  );
  const sectionCount = useExamBuilderStore(
    (state) => state.exam?.sections.length ?? 0,
  );
  const selected = useExamBuilderStore(
    (state) => state.selectedSectionId === sectionId,
  );
  const selectSection = useExamBuilderStore((state) => state.selectSection);
  const duplicateSection = useExamBuilderStore(
    (state) => state.duplicateSection,
  );
  const moveUp = useExamBuilderStore((state) => state.moveSectionUp);
  const moveDown = useExamBuilderStore((state) => state.moveSectionDown);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  if (!section) return null;
  const containsEssay = section.blocks.some((block) => block.type === "essay");
  const label = section.title.trim() || t("examBuilder.sections.untitled");

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
        "rounded-lg border bg-background p-1.5",
        selected && "border-primary bg-accent/50 ring-1 ring-primary/20",
        isDragging && "z-10 opacity-70 shadow-lg",
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="cursor-grab touch-none active:cursor-grabbing"
          aria-label={t("examBuilder.section.actions.drag", { name: label })}
          title={t("examBuilder.section.actions.drag", { name: label })}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
        </Button>
        <button
          type="button"
          dir="auto"
          aria-label={label}
          className="min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-start text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={label}
          onClick={() => selectSection(sectionId)}
        >
          <span className="block truncate">{label}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {t("examBuilder.sections.blockCount", {
              count: section.blocks.length,
            })}
          </span>
        </button>
      </div>
      <div className="flex items-center gap-0.5 border-t pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index <= 0}
          aria-label={t("examBuilder.section.actions.moveUp", { name: label })}
          title={t("examBuilder.section.actions.moveUp", { name: label })}
          onClick={() => moveUp(sectionId)}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index < 0 || index >= sectionCount - 1}
          aria-label={t("examBuilder.section.actions.moveDown", {
            name: label,
          })}
          title={t("examBuilder.section.actions.moveDown", { name: label })}
          onClick={() => moveDown(sectionId)}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={containsEssay}
          aria-label={t("examBuilder.section.actions.duplicate", {
            name: label,
          })}
          title={
            containsEssay
              ? t("examBuilder.blocks.essayLimit")
              : t("examBuilder.section.actions.duplicate", { name: label })
          }
          onClick={() => duplicateSection(sectionId)}
        >
          <Copy aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ms-auto text-destructive hover:text-destructive"
          aria-label={t("examBuilder.section.actions.delete", { name: label })}
          title={t("examBuilder.section.actions.delete", { name: label })}
          onClick={() => onRequestDelete(sectionId)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
