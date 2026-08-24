import { useTranslation } from "react-i18next";

import { ValidatedNumberField } from "@/features/exam-builder/components/block-editors/ValidatedNumberField";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function BlockPointsField({
  blockId,
  value,
  explicitTotalHint = false,
}: {
  blockId: string;
  value: number | undefined;
  explicitTotalHint?: boolean;
}) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const historyKey = `block:${blockId}:points`;

  return (
    <div className="space-y-1">
      <ValidatedNumberField
        id={`block-points-${blockId}`}
        label={t("examBuilder.blocks.fields.points")}
        value={value}
        error={t("examBuilder.blocks.fields.pointsError")}
        min={0}
        step={0.5}
        optional
        isValid={(candidate) => candidate >= 0}
        onValueChange={(points) =>
          updateBlock(
            blockId,
            (block) => {
              const updated = { ...block };
              if (points === undefined) delete updated.points;
              else updated.points = points;
              return updated;
            },
            { historyGroup: historyKey },
          )
        }
        onEditEnd={() => endHistoryGroup(historyKey)}
      />
      {explicitTotalHint ? (
        <p className="text-xs text-muted-foreground">
          {t("examBuilder.blocks.fields.explicitTotalHint")}
        </p>
      ) : null}
    </div>
  );
}
