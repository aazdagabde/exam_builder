import type { TextDocumentBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";
import type { TextDocumentFragment } from "@/features/exam-renderer/pagination/pagination.types";

export function TextDocumentRenderer({
  block,
  labels,
  fragment,
}: {
  block: TextDocumentBlock;
  labels: DocumentLabels;
  fragment?: TextDocumentFragment;
}) {
  const content = fragment?.content ?? block.content;
  const showIntroduction = fragment?.showIntroduction ?? true;
  const showReferences = fragment?.showReferences ?? true;
  const position = fragment?.position ?? "single";
  return (
    <article
      className={`exam-text-document exam-text-document--${position}${block.bordered ? " exam-text-document--bordered" : ""}`}
    >
      {showIntroduction && block.instruction?.trim() ? (
        <p className="exam-instruction" dir="auto">
          {block.instruction}
        </p>
      ) : null}
      {showIntroduction && block.title?.trim() ? (
        <h4 className="exam-document-title" dir="auto">
          {block.title}
          <DocumentPoints points={block.points} labels={labels} />
        </h4>
      ) : showIntroduction ? (
        <DocumentPoints points={block.points} labels={labels} />
      ) : null}
      {content ? (
        <p className="exam-document-content" dir="auto">
          {content}
        </p>
      ) : null}
      {showReferences && (block.source?.trim() || block.reference?.trim()) ? (
        <footer className="exam-document-reference" dir="auto">
          {block.source?.trim() ? (
            <span>
              {labels.source}: {block.source}
            </span>
          ) : null}
          {block.reference?.trim() ? (
            <span>
              {labels.reference}: {block.reference}
            </span>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
