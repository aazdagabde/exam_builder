import { AlertCircle, CheckCircle2, FilePlus2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/components/ui/button";
import type { Exam } from "@/domain/exam";
import { DeleteExamDialog } from "@/features/exams/components/DeleteExamDialog";
import { EmptyExamsState } from "@/features/exams/components/EmptyExamsState";
import { ExamList } from "@/features/exams/components/ExamList";
import { ExamsErrorState } from "@/features/exams/components/ExamsErrorState";
import { ExamsLoadingState } from "@/features/exams/components/ExamsLoadingState";
import {
  useExams,
  type ExamActionFeedback,
} from "@/features/exams/hooks/useExams";
import { ImportProjectDialog } from "@/features/project-backup/components/ImportProjectDialog";
import { cn } from "@/lib/utils";

const feedbackTranslationKeys: Record<ExamActionFeedback, string> = {
  duplicated: "exam.feedback.duplicated",
  deleted: "exam.feedback.deleted",
  duplicateError: "exam.feedback.duplicateError",
  deleteError: "exam.feedback.deleteError",
};

export function DashboardPage() {
  const { t } = useTranslation();
  const {
    state,
    pendingAction,
    feedback,
    reload,
    duplicateExamById,
    deleteExamById,
  } = useExams();
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const feedbackIsError = feedback?.endsWith("Error") ?? false;
  const isDeleting =
    examToDelete !== null &&
    pendingAction?.examId === examToDelete.id &&
    pendingAction.type === "delete";

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        action={
          <div className="flex flex-wrap gap-2">
            <ImportProjectDialog />
            <Button asChild>
              <Link to="/exams/new">
                <FilePlus2 aria-hidden="true" />
                {t("dashboard.newExam")}
              </Link>
            </Button>
          </div>
        }
      />

      {feedback ? (
        <div
          role={feedbackIsError ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
            feedbackIsError
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          {feedbackIsError ? (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4" />
          ) : (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4" />
          )}
          <span>{t(feedbackTranslationKeys[feedback])}</span>
        </div>
      ) : null}

      {state.status === "loading" ? <ExamsLoadingState /> : null}
      {state.status === "error" ? (
        <ExamsErrorState error={state.error} onRetry={() => void reload()} />
      ) : null}
      {state.status === "success" && state.exams.length === 0 ? (
        <EmptyExamsState />
      ) : null}
      {state.status === "success" && state.exams.length > 0 ? (
        <ExamList
          exams={state.exams}
          pendingAction={pendingAction}
          onDuplicate={(examId) => void duplicateExamById(examId)}
          onDelete={setExamToDelete}
        />
      ) : null}

      <DeleteExamDialog
        exam={examToDelete}
        isDeleting={isDeleting}
        onClose={() => setExamToDelete(null)}
        onConfirm={deleteExamById}
      />
    </div>
  );
}
