import type { PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExamBlockType } from "@/domain/exam";
import { getBlockCatalogEntry } from "@/features/exam-builder/blocks/block-catalog";

export function BlockEditorShell({
  type,
  children,
  description,
}: PropsWithChildren<{ type: ExamBlockType; description?: ReactNode }>) {
  const { t } = useTranslation();
  const entry = getBlockCatalogEntry(type);
  const Icon = entry.icon;

  return (
    <Card className="block-editor-shell min-w-0 gap-5 py-5">
      <CardHeader className="px-5">
        <CardTitle
          role="heading"
          aria-level={3}
          className="flex items-center gap-2"
        >
          <Icon className="size-5" aria-hidden="true" />
          {t(entry.labelKey)}
        </CardTitle>
        {description ? (
          <div className="text-sm leading-6 text-muted-foreground">
            {description}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5 px-5">{children}</CardContent>
    </Card>
  );
}
