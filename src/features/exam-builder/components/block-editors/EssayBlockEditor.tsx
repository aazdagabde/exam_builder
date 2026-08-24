import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EssayBlock } from "@/domain/exam";
import {
  createBuilderItemId,
  moveArrayItem,
} from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function EssayBlockEditor({ block }: { block: EssayBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);

  const updateEssay = (
    updater: (essay: EssayBlock) => EssayBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "essay" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateOptionalContext = (value: string) =>
    updateEssay((essay) => {
      const updated = { ...essay };
      if (value === "") delete updated.context;
      else updated.context = value;
      return updated;
    }, `block:${block.id}:context`);

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`essay-context-${block.id}`}>
          {t("examBuilder.blocks.essay.context")}
        </Label>
        <Textarea
          id={`essay-context-${block.id}`}
          dir="auto"
          value={block.context ?? ""}
          placeholder={t("examBuilder.blocks.essay.contextPlaceholder")}
          onChange={(event) => updateOptionalContext(event.target.value)}
          onBlur={() => endHistoryGroup(`block:${block.id}:context`)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`essay-instruction-${block.id}`}>
          {t("examBuilder.blocks.essay.instruction")}
        </Label>
        <Textarea
          id={`essay-instruction-${block.id}`}
          dir="auto"
          value={block.instruction}
          placeholder={t("examBuilder.blocks.essay.instructionPlaceholder")}
          onChange={(event) =>
            updateEssay(
              (essay) => ({ ...essay, instruction: event.target.value }),
              `block:${block.id}:instruction`,
            )
          }
          onBlur={() => endHistoryGroup(`block:${block.id}:instruction`)}
        />
      </div>
      <div className="max-w-xs">
        <BlockPointsField blockId={block.id} value={block.points} />
      </div>
      <section
        className="space-y-3"
        aria-labelledby={`essay-topics-${block.id}`}
      >
        <h4 id={`essay-topics-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.essay.topics")}
        </h4>
        {block.topics.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("examBuilder.blocks.essay.empty")}
          </p>
        ) : null}
        <ol className="space-y-3">
          {block.topics.map((topic, index) => {
            const name = t("examBuilder.blocks.essay.topicNumber", {
              number: index + 1,
            });
            const historyKey = `block:${block.id}:topic:${topic.id}`;
            return (
              <li key={topic.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`essay-topic-${topic.id}`}>{name}</Label>
                  <ItemActions
                    name={name}
                    index={index}
                    count={block.topics.length}
                    onMoveUp={() =>
                      updateEssay((essay) => ({
                        ...essay,
                        topics: moveArrayItem(essay.topics, index, -1),
                      }))
                    }
                    onMoveDown={() =>
                      updateEssay((essay) => ({
                        ...essay,
                        topics: moveArrayItem(essay.topics, index, 1),
                      }))
                    }
                    onRemove={() =>
                      updateEssay((essay) => ({
                        ...essay,
                        topics: essay.topics.filter(
                          (candidate) => candidate.id !== topic.id,
                        ),
                      }))
                    }
                  />
                </div>
                <Input
                  id={`essay-topic-${topic.id}`}
                  dir="auto"
                  value={topic.text}
                  placeholder={t("examBuilder.blocks.essay.topicPlaceholder")}
                  onChange={(event) =>
                    updateEssay(
                      (essay) => ({
                        ...essay,
                        topics: essay.topics.map((candidate) =>
                          candidate.id === topic.id
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
            updateEssay((essay) => ({
              ...essay,
              topics: [
                ...essay.topics,
                { id: createBuilderItemId(), text: "" },
              ],
            }))
          }
        >
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.essay.addTopic")}
        </Button>
      </section>
    </BlockEditorShell>
  );
}
