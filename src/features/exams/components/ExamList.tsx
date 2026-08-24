import type { Exam } from "@/domain/exam";
import { ExamCard } from "@/features/exams/components/ExamCard";
import type { PendingExamAction } from "@/features/exams/hooks/useExams";

interface ExamListProps {
  exams: Exam[];
  pendingAction: PendingExamAction | null;
  onDuplicate(examId: string): void;
  onDelete(exam: Exam): void;
}

export function ExamList({
  exams,
  pendingAction,
  onDuplicate,
  onDelete,
}: ExamListProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          isDuplicating={
            pendingAction?.examId === exam.id &&
            pendingAction.type === "duplicate"
          }
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
