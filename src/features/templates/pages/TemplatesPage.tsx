import { useTranslation } from "react-i18next";

import { PageHeader } from "@/app/components/PageHeader";
import {
  CardContent,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TemplatesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("templates.title")}
        description={t("templates.description")}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t("templates.classic.title")}</CardTitle>
            <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {t("templates.classic.default")}
            </span>
          </div>
          <CardDescription>
            {t("templates.classic.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            aria-hidden="true"
            className="mx-auto aspect-[210/297] w-36 rounded-sm border bg-white p-3 shadow-sm"
          >
            <div className="h-5 rounded-sm border border-foreground/50" />
            <div className="mt-2 h-2 w-2/3 rounded bg-muted-foreground/30" />
            <div className="mt-3 h-3 rounded-sm border border-foreground/40 bg-muted/50" />
            <div className="mt-2 space-y-1.5">
              <div className="h-px bg-muted-foreground/40" />
              <div className="h-px bg-muted-foreground/40" />
              <div className="h-px w-5/6 bg-muted-foreground/40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
