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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { SectionListItem } from "@/features/exam-builder/components/SectionListItem";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function BuilderStructurePanel({
  onRequestDelete,
}: {
  onRequestDelete(id: string): void;
}) {
  const { t } = useTranslation();
  const sections = useExamBuilderStore((state) => state.exam?.sections);
  const sectionIds = sections?.map((section) => section.id) ?? [];
  const addSection = useExamBuilderStore((state) => state.addSection);
  const reorderSections = useExamBuilderStore((state) => state.reorderSections);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      reorderSections(String(active.id), String(over.id));
    }
  };

  return (
    <aside className="builder-structure-panel rounded-xl border bg-card p-3 shadow-sm">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 className="font-semibold">{t("examBuilder.sections.title")}</h2>
        <span className="text-xs text-muted-foreground">
          {t("examBuilder.sections.count", { count: sectionIds.length })}
        </span>
      </div>
      <div className="builder-structure-list pe-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sectionIds}
            strategy={verticalListSortingStrategy}
          >
            <ol
              className="space-y-2"
              aria-label={t("examBuilder.sections.list")}
            >
              {sectionIds.map((sectionId) => (
                <SectionListItem
                  key={sectionId}
                  sectionId={sectionId}
                  onRequestDelete={onRequestDelete}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full shrink-0"
        onClick={() => addSection()}
      >
        <Plus aria-hidden="true" />
        {t("examBuilder.sections.add")}
      </Button>
    </aside>
  );
}
