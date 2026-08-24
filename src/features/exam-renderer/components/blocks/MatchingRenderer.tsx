import type { MatchingBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function MatchingRenderer({
  block,
  labels,
}: {
  block: MatchingBlock;
  labels: DocumentLabels;
}) {
  const rowCount = Math.max(block.leftItems.length, block.rightItems.length);
  return (
    <div className="exam-matching">
      {block.instruction?.trim() ? (
        <p className="exam-instruction" dir="auto">
          {block.instruction}
        </p>
      ) : null}
      <div className="exam-matching-grid">
        {Array.from({ length: rowCount }, (_, index) => (
          <div key={index} className="exam-matching-row">
            <span dir="auto">{block.leftItems[index]?.text ?? ""}</span>
            <span className="exam-matching-space" aria-hidden="true" />
            <span dir="auto">{block.rightItems[index]?.text ?? ""}</span>
          </div>
        ))}
      </div>
      <DocumentPoints points={block.points} labels={labels} />
    </div>
  );
}
