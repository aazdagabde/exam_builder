import { FilePlus2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ImportProjectDialog } from "@/features/project-backup/components/ImportProjectDialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyExamsState() {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardHeader className="items-center py-10 text-center">
        <div className="mb-2 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <FilePlus2 aria-hidden="true" className="size-5" />
        </div>
        <CardTitle>{t("dashboard.empty.title")}</CardTitle>
        <CardDescription className="max-w-lg">
          {t("dashboard.empty.description")}
        </CardDescription>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/exams/new">
              <FilePlus2 aria-hidden="true" />
              {t("dashboard.newExam")}
            </Link>
          </Button>
          <ImportProjectDialog />
        </div>
      </CardHeader>
    </Card>
  );
}
