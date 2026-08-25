// @vitest-environment node

import {
  computeTimelineEventPositions,
  computeTimelinePeriodPositions,
  computeTimelineTicks,
  getTimelineTickCount,
  MAX_TIMELINE_TICKS,
  type TimelineEvent,
} from "@/domain/exam";

const scale = { start: 1912, end: 1956, step: 4, unitLabel: "années" };
const events: TimelineEvent[] = [
  { id: "a", date: "1921", axisValue: 1921, label: "A", description: "" },
];

describe("advanced timeline layout", () => {
  it("generates the expected bounded ticks for 1912 → 1956 step 4", () => {
    expect(computeTimelineTicks(scale).map((tick) => tick.value)).toEqual([
      1912, 1916, 1920, 1924, 1928, 1932, 1936, 1940, 1944, 1948, 1952, 1956,
    ]);
    expect(getTimelineTickCount({ ...scale, step: 1 })).toBe(45);
    expect(computeTimelineTicks({ ...scale, step: 1 })).toHaveLength(
      MAX_TIMELINE_TICKS,
    );
    expect(
      computeTimelineTicks({
        start: -500,
        end: 500,
        step: 500,
        unitLabel: "",
      }).map((tick) => tick.value),
    ).toEqual([-500, 0, 500]);
  });

  it("positions an off-tick event proportionally and mirrors geometry only", () => {
    const compactScale = { start: 1920, end: 1924, step: 2, unitLabel: "" };
    const ltr = computeTimelineEventPositions({
      events,
      scale: compactScale,
      direction: "ltr",
      left: 0,
      right: 100,
      scaled: true,
    }).positions[0]!;
    const rtl = computeTimelineEventPositions({
      events,
      scale: compactScale,
      direction: "rtl",
      left: 0,
      right: 100,
      scaled: true,
    }).positions[0]!;
    expect(ltr.ratio).toBe(0.25);
    expect(ltr.x).toBe(25);
    expect(rtl.ratio).toBe(0.25);
    expect(rtl.x).toBe(75);
  });

  it("computes period proportions and assigns lanes to overlaps", () => {
    const positions = computeTimelinePeriodPositions({
      periods: [
        { id: "a", startValue: 1912, endValue: 1934, label: "A" },
        { id: "b", startValue: 1920, endValue: 1940, label: "B" },
      ],
      scale,
      direction: "ltr",
      left: 0,
      right: 100,
    });
    expect(positions[0]!.startRatio).toBe(0);
    expect(positions[0]!.endRatio).toBe(0.5);
    expect(positions.map((period) => period.lane)).toEqual([0, 1]);
  });

  it("uses several readable lanes for close events", () => {
    const close = [1952, 1953, 1954].map((axisValue) => ({
      id: String(axisValue),
      date: String(axisValue),
      axisValue,
      label: String(axisValue),
      description: "",
    }));
    const { positions } = computeTimelineEventPositions({
      events: close,
      scale,
      direction: "ltr",
      left: 0,
      right: 1000,
      scaled: true,
    });
    expect(new Set(positions.map((event) => event.lane)).size).toBeGreaterThan(
      1,
    );
  });
});
