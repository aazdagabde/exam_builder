// @vitest-environment node

import {
  addChartCategory,
  addChartSeries,
  ChartBlockSchema,
  createExamBlock,
  moveChartCategory,
  removeChartCategory,
  TimelineBlockSchema,
} from "@/domain/exam";

describe("visual block Domain", () => {
  it("creates schema-valid Timeline and Chart defaults with stable internal IDs", () => {
    let id = 0;
    const createInternalId = (kind: string) => `${kind}-${++id}`;
    const timeline = createExamBlock({
      type: "timeline",
      id: "timeline",
      order: 0,
      createInternalId,
    });
    const chart = createExamBlock({
      type: "chart",
      id: "chart",
      order: 1,
      createInternalId,
    });

    expect(timeline).toMatchObject({
      type: "timeline",
      startsNewQuestion: true,
      orientation: "horizontal",
      showDates: true,
      timelineStyle: "historical",
      spacingMode: "scaled",
      chronologyDirection: "ltr",
      scale: { start: 1900, end: 1950, step: 10, unitLabel: "" },
      periods: [],
    });
    expect(chart).toMatchObject({
      type: "chart",
      startsNewQuestion: true,
      chartType: "bar",
      showLegend: true,
      showValues: false,
    });
    expect(TimelineBlockSchema.safeParse(timeline).success).toBe(true);
    expect(ChartBlockSchema.safeParse(chart).success).toBe(true);
  });

  it("rejects duplicate timeline event IDs", () => {
    expect(
      TimelineBlockSchema.safeParse({
        id: "timeline",
        type: "timeline",
        order: 0,
        startsNewQuestion: true,
        events: [
          {
            id: "same",
            date: "1912",
            axisValue: null,
            label: "A",
            description: "",
          },
          {
            id: "same",
            date: "1956",
            axisValue: null,
            label: "B",
            description: "",
          },
        ],
        orientation: "vertical",
        showDates: true,
        timelineStyle: "simple",
        spacingMode: "sequence",
        chronologyDirection: "ltr",
        scale: null,
        periods: [],
        scaleCaption: "",
      }).success,
    ).toBe(false);
  });

  it("maintains chart value alignment across category CRUD and reorder", () => {
    const source = ChartBlockSchema.parse({
      id: "chart",
      type: "chart",
      order: 0,
      startsNewQuestion: true,
      chartType: "line",
      labels: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      series: [{ id: "s", name: "S", values: [10, 20] }],
      showLegend: true,
      showValues: true,
    });

    const added = addChartCategory(source, { id: "c", label: "C" });
    expect(added.series[0]!.values).toEqual([10, 20, null]);
    const moved = moveChartCategory(added, "c", -1);
    expect(moved.labels.map((label) => label.id)).toEqual(["a", "c", "b"]);
    expect(moved.series[0]!.values).toEqual([10, null, 20]);
    const removed = removeChartCategory(moved, "a");
    expect(removed.labels.map((label) => label.id)).toEqual(["c", "b"]);
    expect(removed.series[0]!.values).toEqual([null, 20]);
  });

  it("creates a new series with null values and rejects non-finite values", () => {
    const source = ChartBlockSchema.parse({
      id: "chart",
      type: "chart",
      order: 0,
      startsNewQuestion: true,
      chartType: "bar",
      labels: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      series: [],
      showLegend: true,
      showValues: false,
    });
    const added = addChartSeries(source, { id: "series", name: "Series" });
    expect(added.series[0]!.values).toEqual([null, null]);
    expect(
      ChartBlockSchema.safeParse({
        ...added,
        series: [{ ...added.series[0]!, values: [Number.NaN, Infinity] }],
      }).success,
    ).toBe(false);
  });
});
