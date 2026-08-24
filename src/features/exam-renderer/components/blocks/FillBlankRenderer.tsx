import type { FillBlankBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function FillBlankRenderer({
  block,
  labels,
}: {
  block: FillBlankBlock;
  labels: DocumentLabels;
}) {
  return (
    <div className="exam-fill-blank">
      {block.instruction?.trim() ? (
        <p className="exam-instruction" dir="auto">
          {block.instruction}
        </p>
      ) : null}
      <p dir="auto">
        {block.segments.map((segment, index) =>
          segment.type === "text" ? (
            <span key={`text-${index}`}>{segment.value}</span>
          ) : (
            <span
              key={segment.id}
              className="exam-blank"
              style={{
                width: `${Math.min(40, Math.max(3, segment.width ?? 10))}ch`,
              }}
              aria-hidden="true"
            />
          ),
        )}
        <DocumentPoints points={block.points} labels={labels} />
      </p>
    </div>
  );
}
