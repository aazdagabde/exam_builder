import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MatchingBlock, MatchingItem } from "@/domain/exam";
import {
  createBuilderItemId,
  moveArrayItem,
} from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

type MatchingSide = "leftItems" | "rightItems";

export function MatchingBlockEditor({ block }: { block: MatchingBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const instructionKey = `block:${block.id}:instruction`;

  const updateMatching = (
    updater: (matching: MatchingBlock) => MatchingBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "matching" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const renderSide = (side: MatchingSide) => {
    const items = block[side];
    const sideName = side === "leftItems" ? "left" : "right";
    return (
      <section className="space-y-3">
        <h4 className="font-medium">
          {t(`examBuilder.blocks.matching.${sideName}Items`)}
        </h4>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {t("examBuilder.blocks.matching.empty")}
          </p>
        ) : null}
        <ol className="space-y-3">
          {items.map((item, index) => {
            const name = t("examBuilder.blocks.matching.itemNumber", {
              number: index + 1,
            });
            const historyKey = `block:${block.id}:${sideName}:${item.id}`;
            const updateItems = (nextItems: MatchingItem[]) =>
              updateMatching((matching) => ({
                ...matching,
                [side]: nextItems,
              }));
            return (
              <li key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`matching-${sideName}-${item.id}`}>
                    {name}
                  </Label>
                  <ItemActions
                    name={name}
                    index={index}
                    count={items.length}
                    onMoveUp={() =>
                      updateItems(moveArrayItem(items, index, -1))
                    }
                    onMoveDown={() =>
                      updateItems(moveArrayItem(items, index, 1))
                    }
                    onRemove={() =>
                      updateItems(
                        items.filter((candidate) => candidate.id !== item.id),
                      )
                    }
                  />
                </div>
                <Input
                  id={`matching-${sideName}-${item.id}`}
                  dir="auto"
                  value={item.text}
                  placeholder={t("examBuilder.blocks.matching.itemPlaceholder")}
                  onChange={(event) =>
                    updateMatching(
                      (matching) => ({
                        ...matching,
                        [side]: matching[side].map((candidate) =>
                          candidate.id === item.id
                            ? { ...candidate, text: event.target.value }
                            : candidate,
                        ),
                      }),
                      historyKey,
                    )
                  }
                  onBlur={() => endHistoryGroup(historyKey)}
                />
              </li>
            );
          })}
        </ol>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateMatching((matching) => ({
              ...matching,
              [side]: [
                ...matching[side],
                { id: createBuilderItemId(), text: "" },
              ],
            }))
          }
        >
          <Plus aria-hidden="true" />
          {t(
            `examBuilder.blocks.matching.add${sideName === "left" ? "Left" : "Right"}`,
          )}
        </Button>
      </section>
    );
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`matching-instruction-${block.id}`}>
          {t("examBuilder.blocks.matching.instruction")}
        </Label>
        <Textarea
          id={`matching-instruction-${block.id}`}
          dir="auto"
          value={block.instruction ?? ""}
          placeholder={t("examBuilder.blocks.matching.instructionPlaceholder")}
          onChange={(event) =>
            updateMatching((matching) => {
              const updated = { ...matching };
              if (event.target.value === "") delete updated.instruction;
              else updated.instruction = event.target.value;
              return updated;
            }, instructionKey)
          }
          onBlur={() => endHistoryGroup(instructionKey)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <BooleanField
          id={`matching-shuffle-${block.id}`}
          label={t("examBuilder.blocks.matching.shuffleRight")}
          checked={block.shuffleRight ?? false}
          onCheckedChange={(shuffleRight) =>
            updateMatching((matching) => ({ ...matching, shuffleRight }))
          }
        />
        <BlockPointsField blockId={block.id} value={block.points} />
      </div>
      <div className="matching-editor-sides">
        {renderSide("leftItems")}
        {renderSide("rightItems")}
      </div>
    </BlockEditorShell>
  );
}
