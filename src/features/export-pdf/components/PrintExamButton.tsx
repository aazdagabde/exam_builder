import { FileDown, Files, LoaderCircle, RectangleVertical } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePrintExam } from "@/features/export-pdf/hooks/usePrintExam";
import type { PrintPreparationErrorCode } from "@/features/export-pdf/services/print-exam";
import type { PrintLayoutMode } from "@/features/export-pdf/services/print-imposition";
import "@/features/export-pdf/styles/print.css";

const ERROR_KEYS: Record<PrintPreparationErrorCode, string> = {
  NO_EXAM: "exportPdf.errors.noExam",
  INVALID_EXAM: "exportPdf.errors.invalidExam",
  SAVE_FAILED: "exportPdf.errors.saveFailed",
  RENDERER_TIMEOUT: "exportPdf.errors.rendererTimeout",
  IMAGE_FAILED: "exportPdf.errors.imageFailed",
  PRINT_FAILED: "exportPdf.errors.printFailed",
};

export function PrintExamButton({ saveNow }: { saveNow(): Promise<void> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<PrintLayoutMode>("one-up");
  const { status, errorCode, unavailableImageCount, exportPdf } =
    usePrintExam(saveNow);
  const busy = status === "preparing" || status === "printing";
  const messageId = "export-pdf-feedback";

  const handleExport = async () => {
    const succeeded = await exportPdf(layoutMode);
    if (succeeded) setOpen(false);
  };

  const feedback =
    errorCode !== null ? (
      <span
        id={messageId}
        role="alert"
        className="text-xs font-medium text-destructive"
      >
        {t(ERROR_KEYS[errorCode])}
      </span>
    ) : unavailableImageCount > 0 ? (
      <span id={messageId} role="status" className="text-xs text-amber-700">
        {t("exportPdf.warnings.missingImages", {
          count: unavailableImageCount,
        })}
      </span>
    ) : null;

  return (
    <div className="flex min-w-0 items-center gap-2" data-print-hidden>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => !busy && setOpen(nextOpen)}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            disabled={busy}
            aria-label={busy ? t("exportPdf.preparing") : t("exportPdf.action")}
            aria-busy={busy}
            title={t("exportPdf.hint")}
            aria-describedby={!open && feedback ? messageId : undefined}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <FileDown aria-hidden="true" />
            )}
            <span className="hidden xl:inline">
              {busy ? t("exportPdf.preparing") : t("exportPdf.action")}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent
          className="max-w-xl"
          closeLabel={t("common.close")}
          onEscapeKeyDown={(event) => busy && event.preventDefault()}
          onPointerDownOutside={(event) => busy && event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("exportPdf.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("exportPdf.dialog.description")}
            </DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-3" disabled={busy}>
            <legend className="sr-only">
              {t("exportPdf.dialog.layoutLabel")}
            </legend>
            {(
              [
                {
                  mode: "one-up",
                  icon: RectangleVertical,
                  title: t("exportPdf.layouts.oneUp.title"),
                  description: t("exportPdf.layouts.oneUp.description"),
                },
                {
                  mode: "two-up",
                  icon: Files,
                  title: t("exportPdf.layouts.twoUp.title"),
                  description: t("exportPdf.layouts.twoUp.description"),
                },
              ] satisfies Array<{
                mode: PrintLayoutMode;
                icon: typeof Files;
                title: string;
                description: string;
              }>
            ).map((option) => {
              const Icon = option.icon;
              const checked = layoutMode === option.mode;
              return (
                <label
                  key={option.mode}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="pdf-layout"
                    value={option.mode}
                    checked={checked}
                    onChange={() => setLayoutMode(option.mode)}
                    className="mt-1 accent-primary"
                  />
                  <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block font-medium">{option.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("exportPdf.dialog.saveAsPdfHint")}
          </p>

          {open ? feedback : null}

          <div className="flex flex-wrap justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={busy}>
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handleExport()}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <FileDown aria-hidden="true" />
              )}
              {busy ? t("exportPdf.preparing") : t("exportPdf.dialog.continue")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!open && feedback ? <span className="max-w-52">{feedback}</span> : null}
    </div>
  );
}
