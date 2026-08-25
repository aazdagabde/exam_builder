import type { ChartBlock } from "@/domain/exam";

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  categoryIndex: number;
  seriesIndex: number;
}

export interface BarChartMark extends ChartPoint {
  width: number;
  height: number;
  baselineY: number;
}

export interface CartesianChartLayout {
  width: number;
  height: number;
  plot: { left: number; top: number; right: number; bottom: number };
  min: number;
  max: number;
  zeroY: number;
  ticks: Array<{ value: number; y: number }>;
  categoryXs: number[];
}

export interface PieSlice {
  categoryIndex: number;
  value: number;
  percentage: number;
  path: string;
  labelX: number;
  labelY: number;
}

const WIDTH = 640;
const HEIGHT = 300;
const PLOT = { left: 58, top: 18, right: 618, bottom: 244 } as const;

function finiteValues(block: ChartBlock): number[] {
  return block.series.flatMap((series) =>
    series.values.filter((value): value is number => value !== null),
  );
}

export function computeCartesianChartLayout(
  block: ChartBlock,
): CartesianChartLayout {
  const values = finiteValues(block);
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (min === max) {
    if (min === 0) max = 1;
    else if (min > 0) min = 0;
    else max = 0;
  }
  const range = max - min || 1;
  const y = (value: number) =>
    PLOT.bottom - ((value - min) / range) * (PLOT.bottom - PLOT.top);
  const categoryWidth =
    (PLOT.right - PLOT.left) / Math.max(1, block.labels.length);
  return {
    width: WIDTH,
    height: HEIGHT,
    plot: PLOT,
    min,
    max,
    zeroY: y(0),
    ticks: Array.from({ length: 5 }, (_, index) => {
      const value = min + (range * index) / 4;
      return { value, y: y(value) };
    }).reverse(),
    categoryXs: block.labels.map(
      (_, index) => PLOT.left + categoryWidth * (index + 0.5),
    ),
  };
}

export function computeBarChartLayout(block: ChartBlock): {
  chart: CartesianChartLayout;
  bars: BarChartMark[];
} {
  const chart = computeCartesianChartLayout(block);
  const categoryWidth =
    (chart.plot.right - chart.plot.left) / Math.max(1, block.labels.length);
  const groupWidth = categoryWidth * 0.72;
  const barWidth = groupWidth / Math.max(1, block.series.length);
  const range = chart.max - chart.min || 1;
  const toY = (value: number) =>
    chart.plot.bottom -
    ((value - chart.min) / range) * (chart.plot.bottom - chart.plot.top);
  const bars: BarChartMark[] = [];
  block.labels.forEach((_, categoryIndex) => {
    block.series.forEach((series, seriesIndex) => {
      const value = series.values[categoryIndex];
      if (value === null || value === undefined) return;
      const valueY = toY(value);
      bars.push({
        x:
          chart.categoryXs[categoryIndex]! -
          groupWidth / 2 +
          seriesIndex * barWidth +
          barWidth * 0.1,
        y: Math.min(valueY, chart.zeroY),
        width: barWidth * 0.8,
        height: Math.max(1, Math.abs(chart.zeroY - valueY)),
        baselineY: chart.zeroY,
        value,
        categoryIndex,
        seriesIndex,
      });
    });
  });
  return { chart, bars };
}

export function computeLineChartLayout(block: ChartBlock): {
  chart: CartesianChartLayout;
  segments: ChartPoint[][][];
} {
  const chart = computeCartesianChartLayout(block);
  const range = chart.max - chart.min || 1;
  const toY = (value: number) =>
    chart.plot.bottom -
    ((value - chart.min) / range) * (chart.plot.bottom - chart.plot.top);
  const segments = block.series.map((series, seriesIndex) => {
    const result: ChartPoint[][] = [];
    let current: ChartPoint[] = [];
    series.values.forEach((value, categoryIndex) => {
      if (value === null) {
        if (current.length > 0) result.push(current);
        current = [];
        return;
      }
      current.push({
        x: chart.categoryXs[categoryIndex] ?? chart.plot.left,
        y: toY(value),
        value,
        categoryIndex,
        seriesIndex,
      });
    });
    if (current.length > 0) result.push(current);
    return result;
  });
  return { chart, segments };
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export function computePieChartLayout(block: ChartBlock): {
  width: number;
  height: number;
  valid: boolean;
  slices: PieSlice[];
} {
  const series = block.series[0];
  if (!series || block.series.length !== 1) {
    return { width: WIDTH, height: HEIGHT, valid: false, slices: [] };
  }
  const values = series.values.map((value) => value ?? 0);
  if (values.some((value) => value < 0)) {
    return { width: WIDTH, height: HEIGHT, valid: false, slices: [] };
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return { width: WIDTH, height: HEIGHT, valid: false, slices: [] };
  }
  const cx = 250;
  const cy = 145;
  const radius = 108;
  let angle = -Math.PI / 2;
  const slices = values.flatMap((value, categoryIndex) => {
    if (value === 0) return [];
    const sweep = (value / total) * Math.PI * 2;
    const end = angle + sweep;
    const startPoint = polar(cx, cy, radius, angle);
    const endPoint = polar(cx, cy, radius, end);
    const mid = angle + sweep / 2;
    const label = polar(cx, cy, radius * 0.62, mid);
    const path = [
      `M ${cx} ${cy}`,
      `L ${startPoint.x} ${startPoint.y}`,
      `A ${radius} ${radius} 0 ${sweep > Math.PI ? 1 : 0} 1 ${endPoint.x} ${endPoint.y}`,
      "Z",
    ].join(" ");
    angle = end;
    return [
      {
        categoryIndex,
        value,
        percentage: (value / total) * 100,
        path,
        labelX: label.x,
        labelY: label.y,
      },
    ];
  });
  return { width: WIDTH, height: HEIGHT, valid: true, slices };
}
