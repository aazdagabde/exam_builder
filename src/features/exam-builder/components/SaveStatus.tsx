import { AlertCircle, CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { BuilderSaveStatus } from "@/features/exam-builder/store/exam-builder.types";
import { cn } from "@/lib/utils";

const icons = {
  saved: CheckCircle2,
  dirty: CloudUpload,
  saving: Loader2,
  error: AlertCircle,
} as const;

export function SaveStatus({
  status,
  onRetry,
}: {
  status: BuilderSaveStatus;
  onRetry(): void;
}) {
  const { t } = useTranslation();
  const Icon = icons[status];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role={status === "error" ? "alert" : "status"}
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          status === "error" && "text-destructive",
          status === "saved" && "text-emerald-700",
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn("size-4", status === "saving" && "animate-spin")}
        />
        <span>{t(`examBuilder.save.${status}`)}</span>
      </div>
      {status === "error" ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t("examBuilder.save.retry")}
        </Button>
      ) : null}
    </div>
  );
}
