// @vitest-environment node

import type { ChartBlock } from "@/domain/exam";
import {
  computeBarChartLayout,
  computeLineChartLayout,
  computePieChartLayout,
} from "@/features/exam-renderer/components/blocks/chart-layout";

function chart(values: Array<number | null>): ChartBlock {
  return {
    id: "chart",
    type: "chart",
    startsNewQuestion: true,
    order: 0,
    chartType: "bar",
    labels: values.map((_, index) => ({
      id: `c-${index}`,
      label: String(index),
    })),
    series: [{ id: "s", name: "Series", values }],
    showLegend: true,
    showValues: true,
  };
}

describe("chart geometry", () => {
  it("supports negative, zero and decimal bars around an explicit zero axis", () => {
    const layout = computeBarChartLayout(chart([-2.5, 0, 3.75]));
    expect(layout.chart.min).toBe(-2.5);
    expect(layout.chart.max).toBe(3.75);
    expect(layout.bars).toHaveLength(3);
    expect(layout.chart.zeroY).toBeGreaterThan(layout.chart.plot.top);
    expect(layout.chart.zeroY).toBeLessThan(layout.chart.plot.bottom);
  });

  it("breaks line segments at null instead of treating null as zero", () => {
    const layout = computeLineChartLayout(chart([1, null, 3, 4]));
    expect(layout.segments[0]).toHaveLength(2);
    expect(layout.segments[0]![0]!.map((point) => point.value)).toEqual([1]);
    expect(layout.segments[0]![1]!.map((point) => point.value)).toEqual([3, 4]);
  });

  it("computes pie percentages and rejects negative values", () => {
    const valid = computePieChartLayout(chart([1, 3]));
    expect(valid.valid).toBe(true);
    expect(valid.slices.map((slice) => slice.percentage)).toEqual([25, 75]);
    expect(computePieChartLayout(chart([1, -1])).valid).toBe(false);
  });

  it("rejects pie geometry when more than one series exists", () => {
    const source = chart([1, 2]);
    expect(
      computePieChartLayout({
        ...source,
        series: [
          ...source.series,
          { id: "s2", name: "Second", values: [2, 1] },
        ],
      }).valid,
    ).toBe(false);
  });
});
