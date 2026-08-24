import type { EssayBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function EssayRenderer({
  block,
  labels,
}: {
  block: EssayBlock;
  labels: DocumentLabels;
}) {
  return (
    <article className="exam-essay">
      {block.context?.trim() ? (
        <p className="exam-essay-context" dir="auto">
          {block.context}
        </p>
      ) : null}
      {block.instruction.trim() || block.points !== undefined ? (
        <p className="exam-instruction" dir="auto">
          {block.instruction}
          <DocumentPoints points={block.points} labels={labels} />
        </p>
      ) : null}
      {block.topics.length > 0 ? (
        <div className="exam-essay-topics">
          <ol>
            {block.topics.map((topic) => (
              <li key={topic.id} dir="auto">
                {topic.text}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </article>
  );
}
