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

const DEFAULT_SCALE = { start: 1900, end: 1950, step: 10, unitLabel: "" };

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

  const scaled = block.spacingMode === "scaled";
  const periodsVisible =
    scaled && block.timelineStyle === "historical" && block.scale !== null;
  const titleKey = `block:${block.id}:timeline:title`;

  const updateScale = (field: "start" | "end" | "step", raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    updateTimeline((timeline) => ({
      ...timeline,
      scale: { ...(timeline.scale ?? DEFAULT_SCALE), [field]: value },
    }));
  };

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

      <section
        className="space-y-3"
        aria-labelledby={`timeline-appearance-${block.id}`}
      >
        <h4 id={`timeline-appearance-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.timeline.appearance")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`timeline-style-${block.id}`}>
              {t("examBuilder.blocks.timeline.style")}
            </Label>
            <NativeSelect
              id={`timeline-style-${block.id}`}
              value={block.timelineStyle}
              onChange={(event) =>
                updateTimeline((timeline) => ({
                  ...timeline,
                  timelineStyle: event.target
                    .value as TimelineBlock["timelineStyle"],
                }))
              }
            >
              <option value="simple">
                {t("examBuilder.blocks.timeline.styles.simple")}
              </option>
              <option value="historical">
                {t("examBuilder.blocks.timeline.styles.historical")}
              </option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`timeline-spacing-${block.id}`}>
              {t("examBuilder.blocks.timeline.spacing")}
            </Label>
            <NativeSelect
              id={`timeline-spacing-${block.id}`}
              value={block.spacingMode}
              onChange={(event) => {
                const spacingMode = event.target
                  .value as TimelineBlock["spacingMode"];
                updateTimeline((timeline) => ({
                  ...timeline,
                  spacingMode,
                  scale:
                    spacingMode === "scaled"
                      ? (timeline.scale ?? { ...DEFAULT_SCALE })
                      : timeline.scale,
                }));
              }}
            >
              <option value="sequence">
                {t("examBuilder.blocks.timeline.spacings.sequence")}
              </option>
              <option value="scaled">
                {t("examBuilder.blocks.timeline.spacings.scaled")}
              </option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`timeline-direction-${block.id}`}>
              {t("examBuilder.blocks.timeline.chronologyDirection")}
            </Label>
            <NativeSelect
              id={`timeline-direction-${block.id}`}
              value={block.chronologyDirection}
              onChange={(event) =>
                updateTimeline((timeline) => ({
                  ...timeline,
                  chronologyDirection: event.target
                    .value as TimelineBlock["chronologyDirection"],
                }))
              }
            >
              <option value="ltr">
                {t("examBuilder.blocks.timeline.directions.ltr")}
              </option>
              <option value="rtl">
                {t("examBuilder.blocks.timeline.directions.rtl")}
              </option>
            </NativeSelect>
          </div>
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
                  orientation: event.target
                    .value as TimelineBlock["orientation"],
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
            {block.orientation === "vertical" &&
            block.timelineStyle === "historical" ? (
              <p className="text-xs text-amber-700" role="status">
                {t("examBuilder.blocks.timeline.verticalHistoricalHint")}
              </p>
            ) : null}
          </div>
        </div>
        <BooleanField
          id={`timeline-dates-${block.id}`}
          label={t("examBuilder.blocks.timeline.showDates")}
          checked={block.showDates}
          onCheckedChange={(showDates) =>
            updateTimeline((timeline) => ({ ...timeline, showDates }))
          }
        />
      </section>

      {scaled && block.scale ? (
        <section
          className="space-y-3"
          aria-labelledby={`timeline-scale-${block.id}`}
        >
          <h4 id={`timeline-scale-${block.id}`} className="font-medium">
            {t("examBuilder.blocks.timeline.scale")}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["start", "end", "step"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`timeline-scale-${field}-${block.id}`}>
                  {t(`examBuilder.blocks.timeline.scaleFields.${field}`)}
                </Label>
                <Input
                  id={`timeline-scale-${field}-${block.id}`}
                  type="number"
                  dir="ltr"
                  step="any"
                  value={block.scale![field]}
                  onChange={(event) => updateScale(field, event.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor={`timeline-unit-${block.id}`}>
                {t("examBuilder.blocks.timeline.scaleFields.unitLabel")}
              </Label>
              <Input
                id={`timeline-unit-${block.id}`}
                dir="auto"
                value={block.scale.unitLabel}
                onChange={(event) =>
                  updateTimeline((timeline) => ({
                    ...timeline,
                    scale: timeline.scale
                      ? { ...timeline.scale, unitLabel: event.target.value }
                      : timeline.scale,
                  }))
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("examBuilder.blocks.timeline.scalePreview", {
              start: block.scale.start,
              end: block.scale.end,
              step: block.scale.step,
            })}
          </p>
          <div className="space-y-2">
            <Label htmlFor={`timeline-caption-${block.id}`}>
              {t("examBuilder.blocks.timeline.scaleCaption")}
            </Label>
            <Input
              id={`timeline-caption-${block.id}`}
              dir="auto"
              value={block.scaleCaption}
              onChange={(event) =>
                updateTimeline((timeline) => ({
                  ...timeline,
                  scaleCaption: event.target.value,
                }))
              }
            />
          </div>
        </section>
      ) : null}

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
            const outOfRange =
              scaled &&
              block.scale &&
              item.axisValue !== null &&
              (item.axisValue < block.scale.start ||
                item.axisValue > block.scale.end);
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
                <div
                  className={`grid min-w-0 gap-3 ${scaled ? "md:grid-cols-3" : "md:grid-cols-2"}`}
                >
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
                      onBlur={() => {
                        if (scaled && item.axisValue === null) {
                          const parsed = Number(item.date.trim());
                          if (
                            item.date.trim() !== "" &&
                            Number.isFinite(parsed)
                          ) {
                            updateTimeline((timeline) => ({
                              ...timeline,
                              events: timeline.events.map((candidate) =>
                                candidate.id === item.id
                                  ? { ...candidate, axisValue: parsed }
                                  : candidate,
                              ),
                            }));
                          }
                        }
                        endHistoryGroup(`${baseKey}:date`);
                      }}
                    />
                  </div>
                  {scaled ? (
                    <div className="space-y-2">
                      <Label htmlFor={`timeline-position-${item.id}`}>
                        {t("examBuilder.blocks.timeline.axisValue")}
                      </Label>
                      <Input
                        id={`timeline-position-${item.id}`}
                        type="number"
                        dir="ltr"
                        step="any"
                        value={item.axisValue ?? ""}
                        aria-invalid={Boolean(outOfRange)}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const value = raw === "" ? null : Number(raw);
                          if (value !== null && !Number.isFinite(value)) return;
                          updateTimeline(
                            (timeline) => ({
                              ...timeline,
                              events: timeline.events.map((candidate) =>
                                candidate.id === item.id
                                  ? { ...candidate, axisValue: value }
                                  : candidate,
                              ),
                            }),
                            `${baseKey}:axisValue`,
                          );
                        }}
                        onBlur={() => endHistoryGroup(`${baseKey}:axisValue`)}
                      />
                      {outOfRange ? (
                        <p className="text-xs text-amber-700" role="status">
                          {t("examBuilder.blocks.timeline.eventOutOfRange", {
                            event: item.label || item.date,
                          })}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
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
                    value={item.description}
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
                  axisValue: null,
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

      {periodsVisible ? (
        <section
          className="space-y-3"
          aria-labelledby={`timeline-periods-${block.id}`}
        >
          <h4 id={`timeline-periods-${block.id}`} className="font-medium">
            {t("examBuilder.blocks.timeline.periods")}
          </h4>
          <ol className="space-y-3">
            {block.periods.map((period, index) => {
              const name = t("examBuilder.blocks.timeline.periodNumber", {
                number: index + 1,
              });
              const outside =
                period.startValue >= period.endValue ||
                period.startValue < block.scale!.start ||
                period.endValue > block.scale!.end;
              return (
                <li key={period.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-semibold">{name}</h5>
                    <ItemActions
                      name={name}
                      index={index}
                      count={block.periods.length}
                      onMoveUp={() =>
                        updateTimeline((timeline) => ({
                          ...timeline,
                          periods: moveArrayItem(timeline.periods, index, -1),
                        }))
                      }
                      onMoveDown={() =>
                        updateTimeline((timeline) => ({
                          ...timeline,
                          periods: moveArrayItem(timeline.periods, index, 1),
                        }))
                      }
                      onRemove={() =>
                        updateTimeline((timeline) => ({
                          ...timeline,
                          periods: timeline.periods.filter(
                            (candidate) => candidate.id !== period.id,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`timeline-period-start-${period.id}`}>
                        {t("examBuilder.blocks.timeline.scaleFields.start")}
                      </Label>
                      <Input
                        id={`timeline-period-start-${period.id}`}
                        type="number"
                        dir="ltr"
                        step="any"
                        value={period.startValue}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (
                            event.target.value !== "" &&
                            Number.isFinite(value)
                          )
                            updateTimeline((timeline) => ({
                              ...timeline,
                              periods: timeline.periods.map((candidate) =>
                                candidate.id === period.id
                                  ? { ...candidate, startValue: value }
                                  : candidate,
                              ),
                            }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`timeline-period-end-${period.id}`}>
                        {t("examBuilder.blocks.timeline.scaleFields.end")}
                      </Label>
                      <Input
                        id={`timeline-period-end-${period.id}`}
                        type="number"
                        dir="ltr"
                        step="any"
                        value={period.endValue}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (
                            event.target.value !== "" &&
                            Number.isFinite(value)
                          )
                            updateTimeline((timeline) => ({
                              ...timeline,
                              periods: timeline.periods.map((candidate) =>
                                candidate.id === period.id
                                  ? { ...candidate, endValue: value }
                                  : candidate,
                              ),
                            }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`timeline-period-label-${period.id}`}>
                        {t("examBuilder.blocks.timeline.periodLabel")}
                      </Label>
                      <Input
                        id={`timeline-period-label-${period.id}`}
                        dir="auto"
                        value={period.label}
                        onChange={(event) =>
                          updateTimeline((timeline) => ({
                            ...timeline,
                            periods: timeline.periods.map((candidate) =>
                              candidate.id === period.id
                                ? { ...candidate, label: event.target.value }
                                : candidate,
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                  {outside ? (
                    <p className="text-xs text-amber-700" role="status">
                      {t("examBuilder.blocks.timeline.periodOutOfRange")}
                    </p>
                  ) : null}
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
                periods: [
                  ...timeline.periods,
                  {
                    id: createBuilderItemId(),
                    startValue: timeline.scale?.start ?? 0,
                    endValue: timeline.scale?.end ?? 1,
                    label: "",
                  },
                ],
              }))
            }
          >
            <Plus aria-hidden="true" />
            {t("examBuilder.blocks.timeline.addPeriod")}
          </Button>
        </section>
      ) : null}

      <BlockPointsField blockId={block.id} value={block.points} />
    </BlockEditorShell>
  );
}
