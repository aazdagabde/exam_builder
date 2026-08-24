import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InstructionBlock } from "@/domain/exam";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function InstructionBlockEditor({ block }: { block: InstructionBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const historyKey = `block:${block.id}:content`;

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`instruction-content-${block.id}`}>
          {t("examBuilder.blocks.instruction.content")}
        </Label>
        <Textarea
          id={`instruction-content-${block.id}`}
          dir="auto"
          value={block.content}
          placeholder={t("examBuilder.blocks.instruction.placeholder")}
          onChange={(event) =>
            updateBlock(
              block.id,
              (candidate) =>
                candidate.type === "instruction"
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
