import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function DocumentPoints({
  points,
  labels,
}: {
  points?: number;
  labels: DocumentLabels;
}) {
  if (points === undefined) return null;
  return (
    <span className="exam-points">
      ({points} {labels.points})
    </span>
  );
}

export function AnswerLines({ count }: { count: number }) {
  return (
    <div className="exam-answer-lines" data-testid="answer-lines">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="exam-answer-line" aria-hidden="true" />
      ))}
    </div>
  );
}
