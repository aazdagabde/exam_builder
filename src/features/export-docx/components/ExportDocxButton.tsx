import { FileText, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useExportExamDocx } from "@/features/export-docx/hooks/useExportExamDocx";
import type { ExportDocxErrorCode } from "@/features/export-docx/hooks/useExportExamDocx";

const ERROR_KEYS: Record<ExportDocxErrorCode, string> = {
  NO_EXAM: "exportDocx.errors.noExam",
  SAVE_FAILED: "exportDocx.errors.saveFailed",
  INVALID_EXAM: "exportDocx.errors.invalidExam",
  GENERATION_FAILED: "exportDocx.errors.generationFailed",
  LOGO_LOAD_FAILED: "exportDocx.errors.generationFailed",
  PACK_FAILED: "exportDocx.errors.generationFailed",
  DOWNLOAD_FAILED: "exportDocx.errors.downloadFailed",
};

export function ExportDocxButton({ saveNow }: { saveNow(): Promise<void> }) {
  const { t } = useTranslation();
  const {
    status,
    errorCode,
    unavailableImageCount,
    logoUnavailable,
    exportDocx,
  } = useExportExamDocx(saveNow);
  const busy = status === "preparing" || status === "generating";
  const feedbackId = "export-docx-feedback";
  const busyLabel =
    status === "generating"
      ? t("exportDocx.generating")
      : t("exportDocx.preparing");
  const hasWarning = unavailableImageCount > 0 || logoUnavailable;

  return (
    <div className="flex min-w-0 items-center gap-2" data-print-hidden>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        aria-label={busy ? busyLabel : t("exportDocx.action")}
        aria-busy={busy}
        title={t("exportDocx.hint")}
        aria-describedby={
          errorCode !== null || hasWarning ? feedbackId : undefined
        }
        onClick={() => void exportDocx()}
      >
        {busy ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <FileText aria-hidden="true" />
        )}
        <span className="hidden 2xl:inline">
          {busy ? busyLabel : t("exportDocx.action")}
        </span>
      </Button>

      {errorCode !== null ? (
        <span
          id={feedbackId}
          role="alert"
          className="max-w-52 text-xs font-medium text-destructive"
        >
          {t(ERROR_KEYS[errorCode])}
        </span>
      ) : unavailableImageCount > 0 ? (
        <span
          id={feedbackId}
          role="status"
          className="max-w-44 text-xs text-amber-700"
        >
          {t("exportDocx.warnings.missingImages", {
            count: unavailableImageCount,
          })}
        </span>
      ) : logoUnavailable ? (
        <span
          id={feedbackId}
          role="status"
          className="max-w-44 text-xs text-amber-700"
        >
          {t("exportDocx.warnings.logoUnavailable")}
        </span>
      ) : null}
    </div>
  );
}
