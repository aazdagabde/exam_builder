import type { Exam } from "@/domain/exam";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";
import ministryLogoUrl from "../../../../ressource/logo.svg?url";

function MetadataField({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null;
  const showLabel = !value
    .trim()
    .toLocaleLowerCase()
    .startsWith(label.toLocaleLowerCase());
  return (
    <div className="exam-header-field" dir="auto">
      {showLabel ? <span>{label}:</span> : null} <strong>{value}</strong>
    </div>
  );
}

function titleContainsExamNumber(title: string, examNumber?: string): boolean {
  if (!examNumber?.trim()) return false;
  const escaped = examNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,
    "u",
  ).test(title);
}

function StudentField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="exam-student-field">
      <span>{label}:</span>
      <span className="exam-student-writing-line">{value}</span>
    </div>
  );
}

export function ExamHeader({
  exam,
  labels,
}: {
  exam: Exam;
  labels: DocumentLabels;
}) {
  const { metadata, studentFields } = exam;
  const hasAdministration = Boolean(
    metadata.regionalAcademy?.trim() || metadata.provincialDirectorate?.trim(),
  );
  const hasInstitution = Boolean(
    metadata.institution?.trim() ||
    metadata.teacherName?.trim() ||
    metadata.level.trim() ||
    metadata.subject.trim(),
  );
  const showExamNumber =
    metadata.examNumber?.trim() &&
    !titleContainsExamNumber(metadata.title, metadata.examNumber);

  return (
    <header className="exam-header">
      <div className="exam-header-primary">
        <div className="exam-header-panel exam-header-administration">
          <img
            className="exam-header-logo"
            src={ministryLogoUrl}
            alt=""
            aria-hidden="true"
          />
          {hasAdministration ? (
            <div className="exam-header-administration-fields">
              <MetadataField
                label={labels.academy}
                value={metadata.regionalAcademy}
              />
              <MetadataField
                label={labels.provincialDirectorate}
                value={metadata.provincialDirectorate}
              />
            </div>
          ) : null}
        </div>

        <div className="exam-header-panel exam-header-title">
          {metadata.title.trim() ? (
            <div className="exam-header-document-title" dir="auto">
              {metadata.title}
            </div>
          ) : null}
          <div className="exam-header-title-details">
            {metadata.academicYear.trim() ? (
              <span>
                {labels.academicYear}:{" "}
                <strong dir="auto">{metadata.academicYear}</strong>
              </span>
            ) : null}
            {showExamNumber ? (
              <span dir="auto">№ {metadata.examNumber}</span>
            ) : null}
            {!studentFields.showGrade &&
            exam.settings.showTotalPoints &&
            metadata.totalPoints !== undefined ? (
              <span>
                {labels.total}: <strong>{metadata.totalPoints}</strong>
              </span>
            ) : null}
          </div>
        </div>

        <div className="exam-header-panel exam-header-institution">
          {hasInstitution ? (
            <div className="exam-header-institution-fields">
              <MetadataField
                label={labels.institution}
                value={metadata.institution}
              />
              <MetadataField label={labels.level} value={metadata.level} />
              <MetadataField label={labels.subject} value={metadata.subject} />
              <MetadataField
                label={labels.teacher}
                value={metadata.teacherName}
              />
            </div>
          ) : null}
        </div>
      </div>

      {studentFields.showFullName ||
      studentFields.showStudentNumber ||
      studentFields.showClassName ||
      studentFields.showGrade ? (
        <div className="exam-student-fields">
          {studentFields.showFullName ? (
            <StudentField label={labels.fullName} />
          ) : null}
          {studentFields.showStudentNumber ? (
            <StudentField label={labels.studentNumber} />
          ) : null}
          {studentFields.showClassName ? (
            <StudentField label={labels.className} />
          ) : null}
          {studentFields.showGrade ? (
            <StudentField
              label={labels.grade}
              value={`/ ${metadata.totalPoints ?? 20}`}
            />
          ) : null}
        </div>
      ) : null}

      {metadata.durationMinutes !== undefined ? (
        <div className="exam-header-duration">
          {labels.duration}: <strong>{metadata.durationMinutes}</strong>{" "}
          {labels.minutes}
        </div>
      ) : null}
    </header>
  );
}
