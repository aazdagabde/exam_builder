import type { QuestionBlock } from "@/domain/exam";
import {
  AnswerLines,
  DocumentPoints,
} from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function QuestionRenderer({
  block,
  labels,
}: {
  block: QuestionBlock;
  labels: DocumentLabels;
}) {
  return (
    <div className="exam-question">
      {block.question.trim() || block.points !== undefined ? (
        <div className="exam-question-text" dir="auto">
          {block.question}
          <DocumentPoints points={block.points} labels={labels} />
        </div>
      ) : null}
      {block.answerMode === "lines" ? (
        <AnswerLines count={block.answerLines ?? 1} />
      ) : null}
      {block.answerMode === "box" ? (
        <div
          className="exam-answer-box"
          style={
            block.answerLines
              ? { minHeight: `${block.answerLines * 1.7}em` }
              : undefined
          }
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
