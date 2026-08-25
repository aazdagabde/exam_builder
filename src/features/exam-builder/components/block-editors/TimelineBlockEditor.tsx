import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { TimelineBlock } from "@/domain/exam";
import {
  createBuilderItemId,
  moveArrayItem,
} from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function TimelineBlockEditor({ block }: { block: TimelineBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);

  const updateTimeline = (
    updater: (timeline: TimelineBlock) => TimelineBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "timeline" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const titleKey = `block:${block.id}:timeline:title`;

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`timeline-title-${block.id}`}>
          {t("examBuilder.blocks.timeline.title")}
        </Label>
        <Input
          id={`timeline-title-${block.id}`}
          dir="auto"
          value={block.title ?? ""}
          placeholder={t("examBuilder.blocks.timeline.titlePlaceholder")}
          onChange={(event) =>
            updateTimeline(
              (timeline) => ({ ...timeline, title: event.target.value }),
              titleKey,
            )
          }
          onBlur={() => endHistoryGroup(titleKey)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`timeline-orientation-${block.id}`}>
            {t("examBuilder.blocks.timeline.orientation")}
          </Label>
          <NativeSelect
            id={`timeline-orientation-${block.id}`}
            value={block.orientation}
            onChange={(event) =>
              updateTimeline((timeline) => ({
                ...timeline,
                orientation: event.target.value as TimelineBlock["orientation"],
              }))
            }
          >
            <option value="horizontal">
              {t("examBuilder.blocks.timeline.orientations.horizontal")}
            </option>
            <option value="vertical">
              {t("examBuilder.blocks.timeline.orientations.vertical")}
            </option>
          </NativeSelect>
        </div>
        <BooleanField
          id={`timeline-dates-${block.id}`}
          label={t("examBuilder.blocks.timeline.showDates")}
          checked={block.showDates}
          onCheckedChange={(showDates) =>
            updateTimeline((timeline) => ({ ...timeline, showDates }))
          }
        />
      </div>

      <section
        className="space-y-3"
        aria-labelledby={`timeline-events-${block.id}`}
      >
        <h4 id={`timeline-events-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.timeline.events")}
        </h4>
        <ol className="space-y-3">
          {block.events.map((item, index) => {
            const name = t("examBuilder.blocks.timeline.eventNumber", {
              number: index + 1,
            });
            const baseKey = `block:${block.id}:timeline:event:${item.id}`;
            return (
              <li key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold">{name}</h5>
                  <ItemActions
                    name={name}
                    index={index}
                    count={block.events.length}
                    removeDisabled={block.events.length === 1}
                    onMoveUp={() =>
                      updateTimeline((timeline) => ({
                        ...timeline,
                        events: moveArrayItem(timeline.events, index, -1),
                      }))
                    }
                    onMoveDown={() =>
                      updateTimeline((timeline) => ({
                        ...timeline,
                        events: moveArrayItem(timeline.events, index, 1),
                      }))
                    }
                    onRemove={() =>
                      updateTimeline((timeline) => ({
                        ...timeline,
                        events: timeline.events.filter(
                          (candidate) => candidate.id !== item.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="grid min-w-0 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`timeline-date-${item.id}`}>
                      {t("examBuilder.blocks.timeline.date")}
                    </Label>
                    <Input
                      id={`timeline-date-${item.id}`}
                      dir="auto"
                      value={item.date}
                      placeholder={t(
                        "examBuilder.blocks.timeline.datePlaceholder",
                      )}
                      onChange={(event) =>
                        updateTimeline(
                          (timeline) => ({
                            ...timeline,
                            events: timeline.events.map((candidate) =>
                              candidate.id === item.id
                                ? { ...candidate, date: event.target.value }
                                : candidate,
                            ),
                          }),
                          `${baseKey}:date`,
                        )
                      }
                      onBlur={() => endHistoryGroup(`${baseKey}:date`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`timeline-label-${item.id}`}>
                      {t("examBuilder.blocks.timeline.label")}
                    </Label>
                    <Input
                      id={`timeline-label-${item.id}`}
                      dir="auto"
                      value={item.label}
                      placeholder={t(
                        "examBuilder.blocks.timeline.labelPlaceholder",
                      )}
                      onChange={(event) =>
                        updateTimeline(
                          (timeline) => ({
                            ...timeline,
                            events: timeline.events.map((candidate) =>
                              candidate.id === item.id
                                ? { ...candidate, label: event.target.value }
                                : candidate,
                            ),
                          }),
                          `${baseKey}:label`,
                        )
                      }
                      onBlur={() => endHistoryGroup(`${baseKey}:label`)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`timeline-description-${item.id}`}>
                    {t("examBuilder.blocks.timeline.description")}
                  </Label>
                  <Textarea
                    id={`timeline-description-${item.id}`}
                    dir="auto"
                    value={item.description ?? ""}
                    onChange={(event) =>
                      updateTimeline(
                        (timeline) => ({
                          ...timeline,
                          events: timeline.events.map((candidate) =>
                            candidate.id === item.id
                              ? {
                                  ...candidate,
                                  description: event.target.value,
                                }
                              : candidate,
                          ),
                        }),
                        `${baseKey}:description`,
                      )
                    }
                    onBlur={() => endHistoryGroup(`${baseKey}:description`)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateTimeline((timeline) => ({
              ...timeline,
              events: [
                ...timeline.events,
                {
                  id: createBuilderItemId(),
                  date: "",
                  label: "",
                  description: "",
                },
              ],
            }))
          }
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.timeline.addEvent")}
        </Button>
      </section>

      <BlockPointsField blockId={block.id} value={block.points} />
    </BlockEditorShell>
  );
}
