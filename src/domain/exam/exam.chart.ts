import type {
  ChartBlock,
  ChartCategory,
  ChartSeries,
} from "@/domain/exam/blocks.types";

export function addChartCategory(
  block: ChartBlock,
  category: ChartCategory,
): ChartBlock {
  return {
    ...block,
    labels: [...block.labels, category],
    series: block.series.map((series) => ({
      ...series,
      values: [...series.values, null],
    })),
  };
}

export function removeChartCategory(
  block: ChartBlock,
  categoryId: string,
): ChartBlock {
  const index = block.labels.findIndex(
    (category) => category.id === categoryId,
  );
  if (index < 0) return block;
  return {
    ...block,
    labels: block.labels.filter((category) => category.id !== categoryId),
    series: block.series.map((series) => ({
      ...series,
      values: series.values.filter((_, valueIndex) => valueIndex !== index),
    })),
  };
}

export function moveChartCategory(
  block: ChartBlock,
  categoryId: string,
  offset: -1 | 1,
): ChartBlock {
  const index = block.labels.findIndex(
    (category) => category.id === categoryId,
  );
  const destination = index + offset;
  if (index < 0 || destination < 0 || destination >= block.labels.length) {
    return block;
  }
  const labels = [...block.labels];
  const [category] = labels.splice(index, 1);
  labels.splice(destination, 0, category!);
  return {
    ...block,
    labels,
    series: block.series.map((series) => {
      const values = [...series.values];
      const [value] = values.splice(index, 1);
      values.splice(destination, 0, value ?? null);
      return { ...series, values };
    }),
  };
}

export function addChartSeries(
  block: ChartBlock,
  series: Omit<ChartSeries, "values">,
): ChartBlock {
  return {
    ...block,
    series: [
      ...block.series,
      { ...series, values: block.labels.map(() => null) },
    ],
  };
}

export function removeChartSeries(
  block: ChartBlock,
  seriesId: string,
): ChartBlock {
  return {
    ...block,
    series: block.series.filter((series) => series.id !== seriesId),
  };
}
