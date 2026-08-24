import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ExamMigrationError } from "@/domain/exam";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExamsErrorStateProps {
  error: unknown;
  onRetry(): void;
}

export function ExamsErrorState({ error, onRetry }: ExamsErrorStateProps) {
  const { t } = useTranslation();
  const descriptionKey =
    error instanceof ExamMigrationError &&
    error.code === "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
      ? "dashboard.loadError.futureVersionDescription"
      : "dashboard.loadError.description";

  return (
    <Card role="alert" className="border-destructive/30">
      <CardHeader className="items-center py-10 text-center">
        <div className="mb-2 grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle aria-hidden="true" className="size-5" />
        </div>
        <CardTitle>{t("dashboard.loadError.title")}</CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" />
          {t("dashboard.retry")}
        </Button>
      </CardHeader>
    </Card>
  );
}
