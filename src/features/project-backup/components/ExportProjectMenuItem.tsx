import { Download, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ExportProjectMenuItem({
  isPreparing,
  onExport,
}: {
  isPreparing: boolean;
  onExport(): void;
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenuItem disabled={isPreparing} onSelect={onExport}>
      {isPreparing ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" />
      ) : (
        <Download aria-hidden="true" />
      )}
      {isPreparing
        ? t("projectBackup.export.preparing")
        : t("projectBackup.export.action")}
    </DropdownMenuItem>
  );
}
