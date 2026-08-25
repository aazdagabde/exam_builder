import type { DiagramBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import { computeDiagramLayout } from "@/features/exam-renderer/components/blocks/diagram-layout";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

function safeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function DiagramBlockRenderer({
  block,
  labels,
}: {
  block: DiagramBlock;
  labels: DocumentLabels;
}) {
  const layout = computeDiagramLayout(block, labels.language);
  const prefix = `diagram-${safeId(block.id)}`;
  const markerId = `${prefix}-arrow`;
  const titleId = `${prefix}-title`;
  return (
    <figure
      className="exam-diagram"
      role="img"
      aria-labelledby={titleId}
      data-diagram-layout={block.layout}
      data-diagram-fallback={layout.fallback || undefined}
    >
      <figcaption id={titleId} className="exam-visual-title" dir="auto">
        {block.title.trim() || labels.diagram}
      </figcaption>
      {layout.fallback ? (
        <p className="exam-diagram__warning" role="note">
          {labels.diagramCycle}
        </p>
      ) : null}
      <svg
        className="exam-diagram__svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width="100%"
        aria-hidden="true"
        data-document-language={labels.language}
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
            <path d="M0,0 L0,6 L9,3 z" fill="#1f2937" />
          </marker>
        </defs>
        <g className="exam-diagram__edges">
          {layout.edges.map(({ edge, path, labelX, labelY }) => (
            <g key={edge.id} data-edge-id={edge.id}>
              <path d={path} markerEnd={`url(#${markerId})`} />
              {edge.label.trim() ? (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  direction={labels.direction}
                >
                  {edge.label}
                </text>
              ) : null}
            </g>
          ))}
        </g>
        <g className="exam-diagram__nodes">
          {layout.nodes.map(({ node, x, y, width, height, lines }) => (
            <g key={node.id} data-node-id={node.id}>
              <rect x={x} y={y} width={width} height={height} rx="8" />
              <text
                x={x + width / 2}
                y={y + height / 2 - (lines.length - 1) * 9}
                textAnchor="middle"
                direction={labels.direction}
              >
                {lines.map((line, index) => (
                  <tspan
                    key={index}
                    x={x + width / 2}
                    dy={index === 0 ? 0 : 18}
                  >
                    {line || "\u00a0"}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <DocumentPoints points={block.points} labels={labels} />
    </figure>
  );
}
