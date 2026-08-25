import type {
  TimelineChronologyDirection,
  TimelineEvent,
  TimelinePeriod,
  TimelineScale,
} from "@/domain/exam/blocks.types";

export const MAX_TIMELINE_TICKS = 30;
export const MAX_TIMELINE_EVENT_LANES = 4;

export interface TimelineTick {
  value: number;
  ratio: number;
}

export interface TimelineEventPosition {
  event: TimelineEvent;
  ratio: number | null;
  x: number;
  lane: number;
  inRange: boolean;
}

export interface TimelinePeriodPosition {
  period: TimelinePeriod;
  startRatio: number;
  endRatio: number;
  startX: number;
  endX: number;
  lane: number;
  inRange: boolean;
}

export function isValidTimelineScale(
  scale: TimelineScale | null,
): scale is TimelineScale {
  return (
    scale !== null &&
    Number.isFinite(scale.start) &&
    Number.isFinite(scale.end) &&
    Number.isFinite(scale.step) &&
    scale.step > 0 &&
    scale.start < scale.end
  );
}

export function getTimelineTickCount(scale: TimelineScale | null): number {
  if (!isValidTimelineScale(scale)) return 0;
  const stepCount = Math.floor((scale.end - scale.start) / scale.step + 1e-9);
  const lastSteppedValue = scale.start + stepCount * scale.step;
  return stepCount + 1 + (lastSteppedValue < scale.end - 1e-9 ? 1 : 0);
}

/** Generates a bounded set of abstract numeric ticks without using Date. */
export function computeTimelineTicks(
  scale: TimelineScale | null,
  maximum = MAX_TIMELINE_TICKS,
): TimelineTick[] {
  if (!isValidTimelineScale(scale)) return [];
  const actualTickCount = getTimelineTickCount(scale);
  const tickCount = Math.min(actualTickCount, maximum);
  const range = scale.end - scale.start;
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const value = scale.start + scale.step * index;
    return { value, ratio: (value - scale.start) / range };
  });
  const last = ticks.at(-1);
  if (last && last.value < scale.end) {
    if (ticks.length === maximum) ticks.pop();
    ticks.push({ value: scale.end, ratio: 1 });
  }
  return ticks;
}

export function timelineRatioToX(
  ratio: number,
  direction: TimelineChronologyDirection,
  left: number,
  right: number,
): number {
  const visualRatio = direction === "rtl" ? 1 - ratio : ratio;
  return left + visualRatio * (right - left);
}

export function computeTimelineEventPositions({
  events,
  scale,
  direction,
  left,
  right,
  scaled,
  minimumLabelDistance = 108,
}: {
  events: readonly TimelineEvent[];
  scale: TimelineScale | null;
  direction: TimelineChronologyDirection;
  left: number;
  right: number;
  scaled: boolean;
  minimumLabelDistance?: number;
}): { positions: TimelineEventPosition[]; tooDense: boolean } {
  const validScale = isValidTimelineScale(scale);
  const positions = events.map((event, index): TimelineEventPosition => {
    const ratio =
      scaled && validScale && event.axisValue !== null
        ? (event.axisValue - scale.start) / (scale.end - scale.start)
        : scaled
          ? null
          : events.length === 1
            ? 0.5
            : index / (events.length - 1);
    const fallbackRatio =
      events.length === 1 ? 0.5 : index / (events.length - 1);
    return {
      event,
      ratio,
      x: timelineRatioToX(ratio ?? fallbackRatio, direction, left, right),
      lane: 0,
      inRange: ratio !== null && ratio >= 0 && ratio <= 1,
    };
  });

  const laneEnds = Array<number>(MAX_TIMELINE_EVENT_LANES).fill(-Infinity);
  let tooDense = false;
  [...positions]
    .sort((a, b) => a.x - b.x)
    .forEach((position) => {
      const availableLane = laneEnds.findIndex(
        (lastX) => position.x - lastX >= minimumLabelDistance,
      );
      position.lane =
        availableLane === -1 ? MAX_TIMELINE_EVENT_LANES - 1 : availableLane;
      if (availableLane === -1) tooDense = true;
      laneEnds[position.lane] = position.x;
    });
  return { positions, tooDense };
}

export function computeTimelinePeriodPositions({
  periods,
  scale,
  direction,
  left,
  right,
}: {
  periods: readonly TimelinePeriod[];
  scale: TimelineScale | null;
  direction: TimelineChronologyDirection;
  left: number;
  right: number;
}): TimelinePeriodPosition[] {
  if (!isValidTimelineScale(scale)) return [];
  const positions = periods.map((period): TimelinePeriodPosition => {
    const startRatio =
      (period.startValue - scale.start) / (scale.end - scale.start);
    const endRatio =
      (period.endValue - scale.start) / (scale.end - scale.start);
    const visualStart = timelineRatioToX(startRatio, direction, left, right);
    const visualEnd = timelineRatioToX(endRatio, direction, left, right);
    const rangeStart = Math.min(visualStart, visualEnd);
    const rangeEnd = Math.max(visualStart, visualEnd);
    return {
      period,
      startRatio,
      endRatio,
      startX: rangeStart,
      endX: rangeEnd,
      lane: 0,
      inRange: startRatio >= 0 && endRatio <= 1,
    };
  });
  const laneEnds: number[] = [];
  [...positions]
    .sort((a, b) => a.startX - b.startX)
    .forEach((position) => {
      let lane = laneEnds.findIndex((end) => position.startX >= end + 8);
      if (lane === -1) lane = laneEnds.length;
      position.lane = lane;
      laneEnds[lane] = position.endX;
    });
  return positions;
}
