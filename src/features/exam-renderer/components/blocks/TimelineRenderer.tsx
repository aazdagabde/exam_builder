import type { TimelineBlock } from "@/domain/exam";
import {
  computeTimelineEventPositions,
  computeTimelinePeriodPositions,
  computeTimelineTicks,
  isValidTimelineScale,
  timelineRatioToX,
} from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

const VIEWBOX_WIDTH = 1000;
const AXIS_LEFT = 55;
const AXIS_RIGHT = 945;
const AXIS_Y = 58;

function SimpleTimeline({ block }: { block: TimelineBlock }) {
  return (
    <ol
      className="exam-timeline__events"
      dir={
        block.orientation === "horizontal"
          ? block.chronologyDirection
          : undefined
      }
    >
      {block.events.map((event) => (
        <li key={event.id} className="exam-timeline__event">
          {block.showDates ? (
            <div className="exam-timeline__date" dir="auto">
              {event.date || "\u00a0"}
            </div>
          ) : null}
          <span className="exam-timeline__marker" aria-hidden="true" />
          <div className="exam-timeline__content">
            <div className="exam-timeline__label" dir="auto">
              {event.label || "\u00a0"}
            </div>
            {event.description.trim() ? (
              <div className="exam-timeline__description" dir="auto">
                {event.description}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function HistoricalTimeline({ block }: { block: TimelineBlock }) {
  const scale = block.scale;
  if (!isValidTimelineScale(scale)) return <SimpleTimeline block={block} />;

  const ticks = computeTimelineTicks(scale);
  const { positions } = computeTimelineEventPositions({
    events: block.events,
    scale,
    direction: block.chronologyDirection,
    left: AXIS_LEFT,
    right: AXIS_RIGHT,
    scaled: true,
  });
  const periodPositions = computeTimelinePeriodPositions({
    periods: block.periods,
    scale,
    direction: block.chronologyDirection,
    left: AXIS_LEFT,
    right: AXIS_RIGHT,
  });
  const eventLaneCount = Math.max(1, ...positions.map(({ lane }) => lane + 1));
  const periodLaneCount = Math.max(
    0,
    ...periodPositions.map(({ lane }) => lane + 1),
  );
  const periodTop = AXIS_Y + 54 + eventLaneCount * 50;
  const captionY = periodTop + periodLaneCount * 34 + 24;
  const height = Math.max(170, captionY + (block.scaleCaption.trim() ? 24 : 4));
  const markerId = `timeline-${block.id}-arrow`;
  const axisStart =
    block.chronologyDirection === "ltr" ? AXIS_LEFT : AXIS_RIGHT;
  const axisEnd = block.chronologyDirection === "ltr" ? AXIS_RIGHT : AXIS_LEFT;

  return (
    <svg
      className="exam-timeline__svg"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      width="100%"
      role="img"
      aria-label={block.title || "Timeline"}
      data-chronology-direction={block.chronologyDirection}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#111" />
        </marker>
      </defs>
      <line
        className="exam-timeline__axis"
        x1={axisStart}
        x2={axisEnd}
        y1={AXIS_Y}
        y2={AXIS_Y}
        markerEnd={`url(#${markerId})`}
      />
      {ticks.map((tick) => {
        const x = timelineRatioToX(
          tick.ratio,
          block.chronologyDirection,
          AXIS_LEFT,
          AXIS_RIGHT,
        );
        return (
          <g key={tick.value} className="exam-timeline__tick">
            <line x1={x} x2={x} y1={AXIS_Y - 7} y2={AXIS_Y + 7} />
            <text x={x} y={AXIS_Y - 15} textAnchor="middle" direction="ltr">
              {String(tick.value)}
            </text>
          </g>
        );
      })}
      {scale.unitLabel.trim() ? (
        <text
          className="exam-timeline__unit"
          x={VIEWBOX_WIDTH / 2}
          y={18}
          textAnchor="middle"
        >
          {scale.unitLabel}
        </text>
      ) : null}
      {positions.map((position, index) => {
        const fallbackX = timelineRatioToX(
          block.events.length === 1 ? 0.5 : index / (block.events.length - 1),
          block.chronologyDirection,
          AXIS_LEFT,
          AXIS_RIGHT,
        );
        const x = position.inRange ? position.x : fallbackX;
        const textY = AXIS_Y + 42 + position.lane * 50;
        const preciseDate =
          block.showDates &&
          position.event.date.trim() &&
          position.event.date.trim() !== String(position.event.axisValue ?? "");
        return (
          <g
            key={position.event.id}
            className="exam-timeline__historical-event"
            data-event-id={position.event.id}
            data-event-lane={position.lane}
            data-event-in-range={position.inRange}
          >
            <line x1={x} x2={x} y1={AXIS_Y} y2={textY - 15} />
            <circle cx={x} cy={AXIS_Y} r="5" />
            {preciseDate ? (
              <text x={x} y={textY - 2} textAnchor="middle">
                {position.event.date}
              </text>
            ) : null}
            <text
              className="exam-timeline__event-label"
              x={x}
              y={textY + (preciseDate ? 15 : 0)}
              textAnchor="middle"
            >
              {position.event.label || "\u00a0"}
            </text>
            {position.event.description.trim() ? (
              <text
                className="exam-timeline__event-description"
                x={x}
                y={textY + (preciseDate ? 30 : 15)}
                textAnchor="middle"
              >
                {position.event.description}
              </text>
            ) : null}
          </g>
        );
      })}
      {periodPositions.map((position) => {
        const y = periodTop + position.lane * 34;
        return (
          <g
            key={position.period.id}
            className={`exam-timeline__period exam-timeline__period--${position.lane % 2}`}
            data-period-lane={position.lane}
            data-period-in-range={position.inRange}
          >
            <rect
              x={position.startX}
              y={y}
              width={Math.max(1, position.endX - position.startX)}
              height="26"
              rx="3"
            />
            <text
              x={(position.startX + position.endX) / 2}
              y={y + 17}
              textAnchor="middle"
            >
              {position.period.label}
            </text>
          </g>
        );
      })}
      {block.scaleCaption.trim() ? (
        <text
          className="exam-timeline__caption"
          x={VIEWBOX_WIDTH / 2}
          y={captionY}
          textAnchor="middle"
        >
          {block.scaleCaption}
        </text>
      ) : null}
    </svg>
  );
}

export function TimelineRenderer({
  block,
  labels,
}: {
  block: TimelineBlock;
  labels: DocumentLabels;
}) {
  const advanced =
    block.timelineStyle === "historical" &&
    block.spacingMode === "scaled" &&
    block.orientation === "horizontal";
  return (
    <figure
      className={`exam-timeline exam-timeline--${block.orientation} exam-timeline--${block.timelineStyle}`}
      data-timeline-orientation={block.orientation}
      data-timeline-style={block.timelineStyle}
    >
      {block.title?.trim() ? (
        <figcaption className="exam-visual-title" dir="auto">
          {block.title}
        </figcaption>
      ) : null}
      {advanced ? (
        <HistoricalTimeline block={block} />
      ) : (
        <SimpleTimeline block={block} />
      )}
      <DocumentPoints points={block.points} labels={labels} />
    </figure>
  );
}
