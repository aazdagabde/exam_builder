import type { DefinitionBlock } from "@/domain/exam";
import {
  AnswerLines,
  DocumentPoints,
} from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";
import type { DefinitionFragment } from "@/features/exam-renderer/pagination/pagination.types";

export function DefinitionRenderer({
  block,
  labels,
  fragment,
}: {
  block: DefinitionBlock;
  labels: DocumentLabels;
  fragment?: DefinitionFragment;
}) {
  const items = fragment?.items ?? block.items;
  const showInstruction = fragment?.showInstruction ?? true;
  const showBlockPoints = fragment?.showBlockPoints ?? true;
  return (
    <div className="exam-definition">
      {showInstruction && block.instruction?.trim() ? (
        <p className="exam-instruction" dir="auto">
          {block.instruction}
        </p>
      ) : null}
      {items.map((item) => (
        <div key={item.id} className="exam-definition-item">
          <div className="exam-definition-term" dir="auto">
            {item.term}
            <DocumentPoints points={item.points} labels={labels} />
          </div>
          <AnswerLines count={item.answerLines} />
        </div>
      ))}
      {showBlockPoints ? (
        <DocumentPoints points={block.points} labels={labels} />
      ) : null}
    </div>
  );
}
