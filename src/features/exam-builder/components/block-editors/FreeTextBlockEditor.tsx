import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { FreeTextBlock, FreeTextVariant } from "@/domain/exam";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

const FREE_TEXT_VARIANTS = ["paragraph", "note", "subtitle"] as const;

export function FreeTextBlockEditor({ block }: { block: FreeTextBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const historyKey = `block:${block.id}:content`;

  const updateVariant = (variant: FreeTextVariant) =>
    updateBlock(block.id, (candidate) =>
      candidate.type === "free-text" ? { ...candidate, variant } : candidate,
    );

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`free-text-variant-${block.id}`}>
          {t("examBuilder.blocks.freeText.variant")}
        </Label>
        <NativeSelect
          id={`free-text-variant-${block.id}`}
          value={block.variant ?? "paragraph"}
          onChange={(event) =>
            updateVariant(event.target.value as FreeTextVariant)
          }
        >
          {FREE_TEXT_VARIANTS.map((variant) => (
            <option key={variant} value={variant}>
              {t(`examBuilder.blocks.freeText.variants.${variant}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`free-text-content-${block.id}`}>
          {t("examBuilder.blocks.freeText.content")}
        </Label>
        <Textarea
          id={`free-text-content-${block.id}`}
          dir="auto"
          value={block.content}
          placeholder={t("examBuilder.blocks.freeText.placeholder")}
          onChange={(event) =>
            updateBlock(
              block.id,
              (candidate) =>
                candidate.type === "free-text"
                  ? { ...candidate, content: event.target.value }
                  : candidate,
              { historyGroup: historyKey },
            )
          }
          onBlur={() => endHistoryGroup(historyKey)}
        />
      </div>
    </BlockEditorShell>
  );
}
