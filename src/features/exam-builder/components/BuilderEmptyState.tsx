import { FilePlus2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function BuilderEmptyState() {
  const { t } = useTranslation();
  const addSection = useExamBuilderStore((state) => state.addSection);

  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
      <FilePlus2 aria-hidden="true" className="mb-4 size-10 text-primary" />
      <h2 className="text-lg font-semibold">{t("examBuilder.empty.title")}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("examBuilder.empty.description")}
      </p>
      <Button type="button" className="mt-5" onClick={() => addSection()}>
        {t("examBuilder.sections.add")}
      </Button>
    </div>
  );
}
