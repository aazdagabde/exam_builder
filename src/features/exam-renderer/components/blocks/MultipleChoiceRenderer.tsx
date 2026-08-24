import type { MultipleChoiceBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function MultipleChoiceRenderer({
  block,
  labels,
}: {
  block: MultipleChoiceBlock;
  labels: DocumentLabels;
}) {
  return (
    <div className="exam-multiple-choice">
      <div className="exam-question-text" dir="auto">
        {block.question}
        <DocumentPoints points={block.points} labels={labels} />
      </div>
      <ul>
        {block.options.map((option) => (
          <li key={option.id} dir="auto">
            <span
              className={
                block.allowMultipleAnswers
                  ? "exam-choice-mark exam-choice-mark--square"
                  : "exam-choice-mark exam-choice-mark--circle"
              }
              aria-hidden="true"
            />
            {option.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
