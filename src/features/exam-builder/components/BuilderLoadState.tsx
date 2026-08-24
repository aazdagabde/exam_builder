import { AlertCircle, FileQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BuilderLoadingState() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-label={t("examBuilder.loading")}
      className="space-y-4"
    >
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export function BuilderNotFoundState() {
  const { t } = useTranslation();
  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardHeader>
        <FileQuestion
          aria-hidden="true"
          className="mx-auto size-10 text-muted-foreground"
        />
        <CardTitle role="heading" aria-level={1}>
          {t("examBuilder.notFound.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-5 text-sm text-muted-foreground">
          {t("examBuilder.notFound.description")}
        </p>
        <Button asChild>
          <Link to="/">{t("examBuilder.back")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function BuilderErrorState({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry(): void;
}) {
  const { t } = useTranslation();
  const descriptionKey =
    error === "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
      ? "examBuilder.error.futureVersionDescription"
      : "examBuilder.error.description";
  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardHeader>
        <AlertCircle
          aria-hidden="true"
          className="mx-auto size-10 text-destructive"
        />
        <CardTitle role="heading" aria-level={1}>
          {t("examBuilder.error.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-5 text-sm text-muted-foreground">
          {t(descriptionKey)}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={onRetry}>
            {t("examBuilder.error.retry")}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t("examBuilder.back")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
