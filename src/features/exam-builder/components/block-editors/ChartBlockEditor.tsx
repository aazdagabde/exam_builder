import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  addChartCategory,
  addChartSeries,
  moveChartCategory,
  removeChartCategory,
  removeChartSeries,
  type ChartBlock,
} from "@/domain/exam";
import { createBuilderItemId } from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

function ChartValueInput({
  id,
  label,
  value,
  onValueChange,
  onEditEnd,
}: {
  id: string;
  label: string;
  value: number | null;
  onValueChange(value: number | null): void;
  onEditEnd(): void;
}) {
  const { t } = useTranslation();
  const [invalidDraft, setInvalidDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  return (
    <div>
      <Input
        id={id}
        type="number"
        dir="ltr"
        step="any"
        value={invalidDraft ?? (value === null ? "" : String(value))}
        aria-label={label}
        aria-invalid={invalid}
        title={
          invalid ? t("examBuilder.blocks.chart.invalidNumber") : undefined
        }
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") {
            setInvalidDraft(null);
            setInvalid(false);
            onValueChange(null);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) {
            setInvalidDraft(raw);
            setInvalid(true);
            return;
          }
          setInvalidDraft(null);
          setInvalid(false);
          onValueChange(parsed);
        }}
        onBlur={() => {
          setInvalid(false);
          setInvalidDraft(null);
          onEditEnd();
        }}
      />
    </div>
  );
}

export function ChartBlockEditor({ block }: { block: ChartBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);

  const updateChart = (
    updater: (chart: ChartBlock) => ChartBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "chart" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateOptionalText = (
    field: "title" | "yAxisLabel",
    value: string,
    historyGroup: string,
  ) => updateChart((chart) => ({ ...chart, [field]: value }), historyGroup);

  const hasNegativePieValue =
    block.chartType === "pie" &&
    block.series.some((series) =>
      series.values.some((value) => value !== null && value < 0),
    );
  const pieUnavailable = block.series.length > 1;

  return (
    <BlockEditorShell type={block.type}>
      <section
        className="space-y-4"
        aria-labelledby={`chart-settings-${block.id}`}
      >
        <p id={`chart-settings-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.chart.chart")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`chart-title-${block.id}`}>
              {t("examBuilder.blocks.chart.title")}
            </Label>
            <Input
              id={`chart-title-${block.id}`}
              dir="auto"
              value={block.title ?? ""}
              onChange={(event) =>
                updateOptionalText(
                  "title",
                  event.target.value,
                  `block:${block.id}:chart:title`,
                )
              }
              onBlur={() => endHistoryGroup(`block:${block.id}:chart:title`)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`chart-type-${block.id}`}>
              {t("examBuilder.blocks.chart.type")}
            </Label>
            <NativeSelect
              id={`chart-type-${block.id}`}
              value={block.chartType}
              onChange={(event) =>
                updateChart((chart) => ({
                  ...chart,
                  chartType: event.target.value as ChartBlock["chartType"],
                }))
              }
            >
              <option value="bar">
                {t("examBuilder.blocks.chart.types.bar")}
              </option>
              <option value="line">
                {t("examBuilder.blocks.chart.types.line")}
              </option>
              <option value="pie" disabled={pieUnavailable}>
                {t("examBuilder.blocks.chart.types.pie")}
              </option>
            </NativeSelect>
            {pieUnavailable ? (
              <p className="text-xs text-amber-700" role="status">
                {t("examBuilder.blocks.chart.pieSingleSeries")}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="space-y-3"
        aria-labelledby={`chart-series-${block.id}`}
      >
        <h4 id={`chart-series-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.chart.series")}
        </h4>
        <div className="space-y-2">
          {block.series.map((series, index) => {
            const label = t("examBuilder.blocks.chart.seriesNumber", {
              number: index + 1,
            });
            const historyKey = `block:${block.id}:chart:series:${series.id}:name`;
            return (
              <div
                key={series.id}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor={`chart-series-${series.id}`}>{label}</Label>
                  <Input
                    id={`chart-series-${series.id}`}
                    dir="auto"
                    value={series.name}
                    placeholder={t(
                      "examBuilder.blocks.chart.seriesPlaceholder",
                    )}
                    onChange={(event) =>
                      updateChart(
                        (chart) => ({
                          ...chart,
                          series: chart.series.map((candidate) =>
                            candidate.id === series.id
                              ? { ...candidate, name: event.target.value }
                              : candidate,
                          ),
                        }),
                        historyKey,
                      )
                    }
                    onBlur={() => endHistoryGroup(historyKey)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end text-destructive hover:text-destructive"
                  aria-label={t("examBuilder.blocks.chart.removeSeries", {
                    name: label,
                  })}
                  onClick={() =>
                    updateChart((chart) => removeChartSeries(chart, series.id))
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateChart((chart) =>
              addChartSeries(chart, {
                id: createBuilderItemId(),
                name: "",
              }),
            )
          }
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.chart.addSeries")}
        </Button>
      </section>

      <section className="space-y-3" aria-labelledby={`chart-data-${block.id}`}>
        <h4 id={`chart-data-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.chart.data")}
        </h4>
        <div className="max-w-full overflow-x-auto rounded-lg border">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-start font-medium">
                  {t("examBuilder.blocks.chart.category")}
                </th>
                {block.series.map((series, index) => (
                  <th
                    key={series.id}
                    className="min-w-32 p-2 text-start font-medium"
                    dir="auto"
                  >
                    {series.name ||
                      t("examBuilder.blocks.chart.seriesNumber", {
                        number: index + 1,
                      })}
                  </th>
                ))}
                <th className="p-2">
                  <span className="sr-only">
                    {t("examBuilder.blocks.chart.actions")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {block.labels.map((category, categoryIndex) => {
                const categoryName = t(
                  "examBuilder.blocks.chart.categoryNumber",
                  {
                    number: categoryIndex + 1,
                  },
                );
                const categoryKey = `block:${block.id}:chart:category:${category.id}`;
                return (
                  <tr key={category.id} className="border-t align-top">
                    <td className="min-w-40 p-2">
                      <Input
                        id={`chart-category-${category.id}`}
                        dir="auto"
                        value={category.label}
                        aria-label={categoryName}
                        placeholder={t(
                          "examBuilder.blocks.chart.categoryPlaceholder",
                        )}
                        onChange={(event) =>
                          updateChart(
                            (chart) => ({
                              ...chart,
                              labels: chart.labels.map((candidate) =>
                                candidate.id === category.id
                                  ? { ...candidate, label: event.target.value }
                                  : candidate,
                              ),
                            }),
                            `${categoryKey}:label`,
                          )
                        }
                        onBlur={() => endHistoryGroup(`${categoryKey}:label`)}
                      />
                    </td>
                    {block.series.map((series, seriesIndex) => {
                      const valueKey = `${categoryKey}:series:${series.id}`;
                      return (
                        <td key={series.id} className="p-2">
                          <ChartValueInput
                            id={`chart-value-${category.id}-${series.id}`}
                            label={t("examBuilder.blocks.chart.valueLabel", {
                              category: category.label || categoryIndex + 1,
                              series: series.name || seriesIndex + 1,
                            })}
                            value={series.values[categoryIndex] ?? null}
                            onValueChange={(value) =>
                              updateChart(
                                (chart) => ({
                                  ...chart,
                                  series: chart.series.map((candidate) =>
                                    candidate.id === series.id
                                      ? {
                                          ...candidate,
                                          values: candidate.values.map(
                                            (candidateValue, valueIndex) =>
                                              valueIndex === categoryIndex
                                                ? value
                                                : candidateValue,
                                          ),
                                        }
                                      : candidate,
                                  ),
                                }),
                                valueKey,
                              )
                            }
                            onEditEnd={() => endHistoryGroup(valueKey)}
                          />
                        </td>
                      );
                    })}
                    <td className="p-2">
                      <ItemActions
                        name={categoryName}
                        index={categoryIndex}
                        count={block.labels.length}
                        onMoveUp={() =>
                          updateChart((chart) =>
                            moveChartCategory(chart, category.id, -1),
                          )
                        }
                        onMoveDown={() =>
                          updateChart((chart) =>
                            moveChartCategory(chart, category.id, 1),
                          )
                        }
                        onRemove={() =>
                          updateChart((chart) =>
                            removeChartCategory(chart, category.id),
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateChart((chart) =>
              addChartCategory(chart, {
                id: createBuilderItemId(),
                label: "",
              }),
            )
          }
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.chart.addCategory")}
        </Button>
      </section>

      {hasNegativePieValue ? (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {t("examBuilder.blocks.chart.pieNegative")}
        </p>
      ) : null}

      <section
        className="space-y-4"
        aria-labelledby={`chart-display-${block.id}`}
      >
        <h4 id={`chart-display-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.chart.display")}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <BooleanField
            id={`chart-legend-${block.id}`}
            label={t("examBuilder.blocks.chart.showLegend")}
            checked={block.showLegend}
            onCheckedChange={(showLegend) =>
              updateChart((chart) => ({ ...chart, showLegend }))
            }
          />
          <BooleanField
            id={`chart-values-${block.id}`}
            label={t("examBuilder.blocks.chart.showValues")}
            checked={block.showValues}
            onCheckedChange={(showValues) =>
              updateChart((chart) => ({ ...chart, showValues }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`chart-y-axis-${block.id}`}>
            {t("examBuilder.blocks.chart.yAxisLabel")}
          </Label>
          <Input
            id={`chart-y-axis-${block.id}`}
            dir="auto"
            value={block.yAxisLabel ?? ""}
            onChange={(event) =>
              updateOptionalText(
                "yAxisLabel",
                event.target.value,
                `block:${block.id}:chart:y-axis`,
              )
            }
            onBlur={() => endHistoryGroup(`block:${block.id}:chart:y-axis`)}
          />
        </div>
      </section>

      <BlockPointsField blockId={block.id} value={block.points} />
    </BlockEditorShell>
  );
}
