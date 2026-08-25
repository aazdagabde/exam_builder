import type { ChartBlock } from "@/domain/exam";
import {
  computeBarChartLayout,
  computeCartesianChartLayout,
  computeLineChartLayout,
  computePieChartLayout,
  type CartesianChartLayout,
} from "@/features/exam-renderer/components/blocks/chart-layout";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#d97706"];
const DASHES = [undefined, "10 5", "3 4", "12 3 3 3", "2 3"];

function numberLabel(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function PatternDefs({ blockId }: { blockId: string }) {
  const prefix = `chart-${safeId(blockId)}`;
  return (
    <defs>
      <pattern
        id={`${prefix}-pattern-1`}
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <rect width="8" height="8" fill={COLORS[1]} />
        <path
          d="M-2 2 L2 -2 M0 8 L8 0 M6 10 L10 6"
          stroke="#fff"
          strokeWidth="1.3"
          opacity="0.75"
        />
      </pattern>
      <pattern
        id={`${prefix}-pattern-2`}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
      >
        <rect width="7" height="7" fill={COLORS[2]} />
        <circle cx="2" cy="2" r="1" fill="#fff" opacity="0.8" />
        <circle cx="6" cy="6" r="1" fill="#fff" opacity="0.8" />
      </pattern>
      <pattern
        id={`${prefix}-pattern-3`}
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <rect width="8" height="8" fill={COLORS[3]} />
        <path
          d="M0 0 L8 8 M8 0 L0 8"
          stroke="#fff"
          strokeWidth="1"
          opacity="0.7"
        />
      </pattern>
    </defs>
  );
}

function seriesFill(blockId: string, index: number): string {
  if (index === 0 || index >= 4) return COLORS[index % COLORS.length]!;
  return `url(#chart-${safeId(blockId)}-pattern-${index})`;
}

function CartesianAxes({
  block,
  chart,
}: {
  block: ChartBlock;
  chart: CartesianChartLayout;
}) {
  return (
    <g className="exam-chart__axes">
      {chart.ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={chart.plot.left}
            x2={chart.plot.right}
            y1={tick.y}
            y2={tick.y}
            className="exam-chart__grid-line"
          />
          <text x={chart.plot.left - 8} y={tick.y + 4} textAnchor="end">
            {numberLabel(tick.value)}
          </text>
        </g>
      ))}
      <line
        x1={chart.plot.left}
        x2={chart.plot.right}
        y1={chart.zeroY}
        y2={chart.zeroY}
        className="exam-chart__zero-line"
      />
      <line
        x1={chart.plot.left}
        x2={chart.plot.left}
        y1={chart.plot.top}
        y2={chart.plot.bottom}
        className="exam-chart__axis-line"
      />
      {block.labels.map((category, index) => (
        <text
          key={category.id}
          x={chart.categoryXs[index]}
          y={chart.plot.bottom + 20}
          textAnchor="middle"
          className="exam-chart__category-label"
        >
          {category.label}
        </text>
      ))}
      {block.yAxisLabel?.trim() ? (
        <text
          x="14"
          y={(chart.plot.top + chart.plot.bottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${(chart.plot.top + chart.plot.bottom) / 2})`}
          className="exam-chart__axis-label"
        >
          {block.yAxisLabel}
        </text>
      ) : null}
    </g>
  );
}

function BarChart({ block }: { block: ChartBlock }) {
  const { chart, bars } = computeBarChartLayout(block);
  return (
    <svg
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      className="exam-chart__svg"
      aria-hidden="true"
    >
      <PatternDefs blockId={block.id} />
      <CartesianAxes block={block} chart={chart} />
      {bars.map((bar) => (
        <g key={`${bar.categoryIndex}-${bar.seriesIndex}`}>
          <rect
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={seriesFill(block.id, bar.seriesIndex)}
            stroke="#111827"
            strokeWidth="0.7"
          />
          {block.showValues ? (
            <text
              x={bar.x + bar.width / 2}
              y={bar.value >= 0 ? bar.y - 4 : bar.y + bar.height + 13}
              textAnchor="middle"
              className="exam-chart__value"
            >
              {numberLabel(bar.value)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

function LineChart({ block }: { block: ChartBlock }) {
  const { chart, segments } = computeLineChartLayout(block);
  return (
    <svg
      viewBox={`0 0 ${chart.width} ${chart.height}`}
      className="exam-chart__svg"
      aria-hidden="true"
    >
      <CartesianAxes block={block} chart={chart} />
      {segments.map((seriesSegments, seriesIndex) =>
        seriesSegments.map((points, segmentIndex) => (
          <g key={`${seriesIndex}-${segmentIndex}`}>
            {points.length > 1 ? (
              <polyline
                points={points
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
                fill="none"
                stroke={COLORS[seriesIndex % COLORS.length]}
                strokeWidth="3"
                strokeDasharray={DASHES[seriesIndex % DASHES.length]}
              />
            ) : null}
            {points.map((point) => (
              <g key={point.categoryIndex}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={seriesIndex % 2 === 0 ? 4 : 5}
                  fill="#fff"
                  stroke={COLORS[seriesIndex % COLORS.length]}
                  strokeWidth="2.5"
                />
                {block.showValues ? (
                  <text
                    x={point.x}
                    y={point.y - 8}
                    textAnchor="middle"
                    className="exam-chart__value"
                  >
                    {numberLabel(point.value)}
                  </text>
                ) : null}
              </g>
            ))}
          </g>
        )),
      )}
    </svg>
  );
}

function PieChart({
  block,
  labels,
}: {
  block: ChartBlock;
  labels: DocumentLabels;
}) {
  const layout = computePieChartLayout(block);
  if (!layout.valid) {
    return <p className="exam-chart__fallback">{labels.chartInvalid}</p>;
  }
  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="exam-chart__svg"
      aria-hidden="true"
    >
      <PatternDefs blockId={block.id} />
      {layout.slices.map((slice) => (
        <g key={slice.categoryIndex}>
          <path
            d={slice.path}
            fill={seriesFill(block.id, slice.categoryIndex)}
            stroke="#fff"
            strokeWidth="2"
          />
          {block.showValues ? (
            <text
              x={slice.labelX}
              y={slice.labelY}
              textAnchor="middle"
              className="exam-chart__pie-value"
            >
              {numberLabel(slice.percentage)}%
            </text>
          ) : null}
        </g>
      ))}
      {block.labels.map((category, index) => (
        <g key={category.id} transform={`translate(410 ${55 + index * 25})`}>
          <rect
            width="14"
            height="14"
            fill={seriesFill(block.id, index)}
            stroke="#111827"
            strokeWidth="0.5"
          />
          <text x="22" y="12" className="exam-chart__legend-text">
            {category.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ChartRenderer({
  block,
  labels,
}: {
  block: ChartBlock;
  labels: DocumentLabels;
}) {
  const titleId = `chart-title-${safeId(block.id)}`;
  const fallbackTitle = labels.chart;
  const chart =
    block.chartType === "bar" ? (
      <BarChart block={block} />
    ) : block.chartType === "line" ? (
      <LineChart block={block} />
    ) : (
      <PieChart block={block} labels={labels} />
    );
  const cartesian =
    block.chartType !== "pie" ? computeCartesianChartLayout(block) : null;

  return (
    <figure className="exam-chart" role="img" aria-labelledby={titleId}>
      <figcaption id={titleId} className="exam-visual-title" dir="auto">
        {block.title?.trim() || fallbackTitle}
      </figcaption>
      {chart}
      {block.showLegend &&
      block.chartType !== "pie" &&
      block.series.length > 1 ? (
        <ul className="exam-chart__legend">
          {block.series.map((series, index) => (
            <li key={series.id}>
              <span
                className="exam-chart__legend-swatch"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                  borderStyle: index % 2 === 0 ? "solid" : "dashed",
                }}
                aria-hidden="true"
              />
              <span dir="auto">
                {series.name || `${labels.series} ${index + 1}`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {cartesian && block.labels.length === 0 ? (
        <p className="exam-chart__fallback">{labels.chartNoData}</p>
      ) : null}
      <DocumentPoints points={block.points} labels={labels} />
    </figure>
  );
}
