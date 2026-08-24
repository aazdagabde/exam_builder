import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DefinitionBlock, DefinitionItem } from "@/domain/exam";
import {
  createBuilderItemId,
  focusEditorField,
  moveArrayItem,
} from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { ValidatedNumberField } from "@/features/exam-builder/components/block-editors/ValidatedNumberField";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

const DEFAULT_ANSWER_LINES = 3;

export function DefinitionBlockEditor({ block }: { block: DefinitionBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const instructionKey = `block:${block.id}:instruction`;

  const updateDefinition = (
    updater: (definition: DefinitionBlock) => DefinitionBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "definition" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateItem = (
    itemId: string,
    updater: (item: DefinitionItem) => DefinitionItem,
    historyGroup?: string,
  ) =>
    updateDefinition(
      (definition) => ({
        ...definition,
        items: definition.items.map((item) =>
          item.id === itemId ? updater(item) : item,
        ),
      }),
      historyGroup,
    );

  const addItem = () => {
    const id = createBuilderItemId();
    updateDefinition((definition) => ({
      ...definition,
      items: [
        ...definition.items,
        { id, term: "", answerLines: DEFAULT_ANSWER_LINES },
      ],
    }));
    focusEditorField(`definition-term-${id}`);
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`definition-instruction-${block.id}`}>
          {t("examBuilder.blocks.definition.instruction")}
        </Label>
        <Textarea
          id={`definition-instruction-${block.id}`}
          dir="auto"
          value={block.instruction ?? ""}
          placeholder={t(
            "examBuilder.blocks.definition.instructionPlaceholder",
          )}
          onChange={(event) =>
            updateDefinition((definition) => {
              const updated = { ...definition };
              if (event.target.value === "") delete updated.instruction;
              else updated.instruction = event.target.value;
              return updated;
            }, instructionKey)
          }
          onBlur={() => endHistoryGroup(instructionKey)}
        />
      </div>

      <div className="max-w-xs">
        <BlockPointsField
          blockId={block.id}
          value={block.points}
          explicitTotalHint
        />
      </div>

      <section
        className="space-y-3"
        aria-labelledby={`definition-items-${block.id}`}
      >
        <h4 id={`definition-items-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.definition.items")}
        </h4>
        <ol className="space-y-3">
          {block.items.map((item, index) => {
            const name = t("examBuilder.blocks.definition.itemNumber", {
              number: index + 1,
            });
            const termKey = `block:${block.id}:item:${item.id}:term`;
            const linesKey = `block:${block.id}:item:${item.id}:answerLines`;
            const pointsKey = `block:${block.id}:item:${item.id}:points`;
            return (
              <li
                key={item.id}
                className="space-y-4 rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold">{name}</h5>
                  <ItemActions
                    name={name}
                    index={index}
                    count={block.items.length}
                    removeDisabled={block.items.length === 1}
                    onMoveUp={() =>
                      updateDefinition((definition) => ({
                        ...definition,
                        items: moveArrayItem(definition.items, index, -1),
                      }))
                    }
                    onMoveDown={() =>
                      updateDefinition((definition) => ({
                        ...definition,
                        items: moveArrayItem(definition.items, index, 1),
                      }))
                    }
                    onRemove={() =>
                      updateDefinition((definition) => ({
                        ...definition,
                        items: definition.items.filter(
                          (candidate) => candidate.id !== item.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`definition-term-${item.id}`}>
                    {t("examBuilder.blocks.definition.term")}
                  </Label>
                  <Input
                    id={`definition-term-${item.id}`}
                    dir="auto"
                    value={item.term}
                    placeholder={t(
                      "examBuilder.blocks.definition.termPlaceholder",
                    )}
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        (candidate) => ({
                          ...candidate,
                          term: event.target.value,
                        }),
                        termKey,
                      )
                    }
                    onBlur={() => endHistoryGroup(termKey)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ValidatedNumberField
                    id={`definition-lines-${item.id}`}
                    label={t("examBuilder.blocks.definition.answerLines")}
                    value={item.answerLines}
                    error={t("examBuilder.blocks.fields.positiveIntegerError")}
                    min={1}
                    step={1}
                    optional={false}
                    isValid={(value) => Number.isInteger(value) && value > 0}
                    onValueChange={(answerLines) => {
                      if (answerLines !== undefined && answerLines > 0) {
                        updateItem(
                          item.id,
                          (candidate) => ({ ...candidate, answerLines }),
                          linesKey,
                        );
                      }
                    }}
                    onEditEnd={() => endHistoryGroup(linesKey)}
                  />
                  <ValidatedNumberField
                    id={`definition-points-${item.id}`}
                    label={t("examBuilder.blocks.definition.points")}
                    value={item.points}
                    error={t("examBuilder.blocks.fields.pointsError")}
                    min={0}
                    step={0.5}
                    optional
                    isValid={(value) => value >= 0}
                    onValueChange={(points) =>
                      updateItem(
                        item.id,
                        (candidate) => {
                          const updated = { ...candidate };
                          if (points === undefined) delete updated.points;
                          else updated.points = points;
                          return updated;
                        },
                        pointsKey,
                      )
                    }
                    onEditEnd={() => endHistoryGroup(pointsKey)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.definition.addItem")}
        </Button>
      </section>
    </BlockEditorShell>
  );
}
