import { ArrowLeft, Redo2, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ExamSettingsDialog } from "@/features/exam-builder/components/ExamSettingsDialog";
import { SaveStatus } from "@/features/exam-builder/components/SaveStatus";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";
import { PrintExamButton } from "@/features/export-pdf/components/PrintExamButton";
import { ExportDocxButton } from "@/features/export-docx/components/ExportDocxButton";

export function BuilderHeader({ onSaveNow }: { onSaveNow(): Promise<void> }) {
  const { t } = useTranslation();
  const title = useExamBuilderStore(
    (state) => state.exam?.metadata.title.trim() ?? "",
  );
  const saveStatus = useExamBuilderStore((state) => state.saveStatus);
  const canUndo = useExamBuilderStore((state) => state.past.length > 0);
  const canRedo = useExamBuilderStore((state) => state.future.length > 0);
  const undo = useExamBuilderStore((state) => state.undo);
  const redo = useExamBuilderStore((state) => state.redo);

  return (
    <header
      className="flex min-w-0 shrink-0 flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      data-print-hidden
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button asChild variant="outline" size="icon">
          <Link to="/" aria-label={t("examBuilder.back")}>
            <ArrowLeft aria-hidden="true" className="rtl:rotate-180" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("examBuilder.title")}
          </p>
          <h1
            dir="auto"
            className="truncate text-lg font-semibold sm:text-xl"
            title={title || t("exam.untitled")}
          >
            {title || t("exam.untitled")}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <ExamSettingsDialog />
        <PrintExamButton saveNow={onSaveNow} />
        <ExportDocxButton saveNow={onSaveNow} />
        <SaveStatus status={saveStatus} onRetry={onSaveNow} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canUndo}
          aria-label={t("examBuilder.undo")}
          onClick={undo}
        >
          <Undo2 aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!canRedo}
          aria-label={t("examBuilder.redo")}
          onClick={redo}
        >
          <Redo2 aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
