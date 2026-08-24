import type { ExamSection } from "@/domain/exam";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function SectionRenderer({
  section,
  labels,
}: {
  section: ExamSection;
  labels: DocumentLabels;
}) {
  return (
    <header className="exam-section-heading">
      {section.title.trim() ? <h2 dir="auto">{section.title}</h2> : <span />}
      {section.points !== undefined ? (
        <span className="exam-points">
          ({section.points} {labels.points})
        </span>
      ) : null}
    </header>
  );
}
