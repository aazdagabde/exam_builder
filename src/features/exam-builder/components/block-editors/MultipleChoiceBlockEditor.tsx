import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MultipleChoiceBlock, MultipleChoiceOption } from "@/domain/exam";
import {
  createBuilderItemId,
  focusEditorField,
  moveArrayItem,
} from "@/features/exam-builder/blocks/editor-list.helpers";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { ItemActions } from "@/features/exam-builder/components/block-editors/ItemActions";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function MultipleChoiceBlockEditor({
  block,
}: {
  block: MultipleChoiceBlock;
}) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const questionKey = `block:${block.id}:question`;

  const updateMultipleChoice = (
    updater: (value: MultipleChoiceBlock) => MultipleChoiceBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "multiple-choice" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateOption = (
    id: string,
    updater: (option: MultipleChoiceOption) => MultipleChoiceOption,
    historyGroup?: string,
  ) =>
    updateMultipleChoice(
      (value) => ({
        ...value,
        options: value.options.map((option) =>
          option.id === id ? updater(option) : option,
        ),
      }),
      historyGroup,
    );

  const addOption = () => {
    const id = createBuilderItemId();
    updateMultipleChoice((value) => ({
      ...value,
      options: [...value.options, { id, text: "" }],
    }));
    focusEditorField(`multiple-choice-option-${id}`);
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`multiple-choice-question-${block.id}`}>
          {t("examBuilder.blocks.multipleChoice.question")}
        </Label>
        <Textarea
          id={`multiple-choice-question-${block.id}`}
          dir="auto"
          value={block.question}
          placeholder={t(
            "examBuilder.blocks.multipleChoice.questionPlaceholder",
          )}
          onChange={(event) =>
            updateMultipleChoice(
              (value) => ({ ...value, question: event.target.value }),
              questionKey,
            )
          }
          onBlur={() => endHistoryGroup(questionKey)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BlockPointsField blockId={block.id} value={block.points} />
        <BooleanField
          id={`multiple-choice-multiple-${block.id}`}
          label={t("examBuilder.blocks.multipleChoice.allowMultipleAnswers")}
          checked={block.allowMultipleAnswers ?? false}
          onCheckedChange={(allowMultipleAnswers) =>
            updateMultipleChoice((value) => ({
              ...value,
              allowMultipleAnswers,
            }))
          }
        />
      </div>

      <section
        className="space-y-3"
        aria-labelledby={`multiple-choice-options-${block.id}`}
      >
        <h4 id={`multiple-choice-options-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.multipleChoice.options")}
        </h4>
        <ol className="space-y-3">
          {block.options.map((option, index) => {
            const name = t("examBuilder.blocks.multipleChoice.optionNumber", {
              number: index + 1,
            });
            const textKey = `block:${block.id}:option:${option.id}:text`;
            return (
              <li
                key={option.id}
                className="space-y-3 rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold">{name}</h5>
                  <ItemActions
                    name={name}
                    index={index}
                    count={block.options.length}
                    removeDisabled={block.options.length === 1}
                    onMoveUp={() =>
                      updateMultipleChoice((value) => ({
                        ...value,
                        options: moveArrayItem(value.options, index, -1),
                      }))
                    }
                    onMoveDown={() =>
                      updateMultipleChoice((value) => ({
                        ...value,
                        options: moveArrayItem(value.options, index, 1),
                      }))
                    }
                    onRemove={() =>
                      updateMultipleChoice((value) => ({
                        ...value,
                        options: value.options.filter(
                          (candidate) => candidate.id !== option.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`multiple-choice-option-${option.id}`}>
                    {t("examBuilder.blocks.multipleChoice.option")}
                  </Label>
                  <Input
                    id={`multiple-choice-option-${option.id}`}
                    dir="auto"
                    value={option.text}
                    placeholder={t(
                      "examBuilder.blocks.multipleChoice.optionPlaceholder",
                    )}
                    onChange={(event) =>
                      updateOption(
                        option.id,
                        (candidate) => ({
                          ...candidate,
                          text: event.target.value,
                        }),
                        textKey,
                      )
                    }
                    onBlur={() => endHistoryGroup(textKey)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
        <Button type="button" variant="outline" onClick={addOption}>
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.multipleChoice.addOption")}
        </Button>
      </section>
    </BlockEditorShell>
  );
}
