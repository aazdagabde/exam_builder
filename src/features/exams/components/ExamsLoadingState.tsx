import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ExamsLoadingState() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t("dashboard.loading")}
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {[0, 1, 2].map((index) => (
        <Card key={index} aria-hidden="true" className="gap-5">
          <CardHeader className="gap-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">{t("dashboard.loading")}</span>
    </div>
  );
}
