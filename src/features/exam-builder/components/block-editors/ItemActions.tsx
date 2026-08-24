import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function ItemActions({
  name,
  index,
  count,
  removeDisabled = false,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  name: string;
  index: number;
  count: number;
  removeDisabled?: boolean;
  onMoveUp(): void;
  onMoveDown(): void;
  onRemove(): void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === 0}
        aria-label={t("examBuilder.blocks.itemActions.moveUp", { name })}
        onClick={onMoveUp}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === count - 1}
        aria-label={t("examBuilder.blocks.itemActions.moveDown", { name })}
        onClick={onMoveDown}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={removeDisabled}
        className="ms-auto text-destructive hover:text-destructive"
        aria-label={t("examBuilder.blocks.itemActions.remove", { name })}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}
