import type { TrueFalseBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function TrueFalseRenderer({
  block,
  labels,
}: {
  block: TrueFalseBlock;
  labels: DocumentLabels;
}) {
  return (
    <div className="exam-true-false">
      {block.instruction?.trim() ? (
        <p className="exam-instruction" dir="auto">
          {block.instruction}
        </p>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>{labels.statement}</th>
            <th>{labels.trueLabel}</th>
            <th>{labels.falseLabel}</th>
          </tr>
        </thead>
        <tbody>
          {block.statements.map((statement) => (
            <tr key={statement.id}>
              <td dir="auto">
                {statement.text}
                <DocumentPoints points={statement.points} labels={labels} />
              </td>
              <td aria-label={labels.trueLabel} />
              <td aria-label={labels.falseLabel} />
            </tr>
          ))}
        </tbody>
      </table>
      <DocumentPoints points={block.points} labels={labels} />
    </div>
  );
}
