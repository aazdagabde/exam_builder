import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TrueFalseBlock, TrueFalseStatement } from "@/domain/exam";
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

export function TrueFalseBlockEditor({ block }: { block: TrueFalseBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const instructionKey = `block:${block.id}:instruction`;

  const updateTrueFalse = (
    updater: (value: TrueFalseBlock) => TrueFalseBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "true-false" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateStatement = (
    id: string,
    updater: (statement: TrueFalseStatement) => TrueFalseStatement,
    historyGroup?: string,
  ) =>
    updateTrueFalse(
      (value) => ({
        ...value,
        statements: value.statements.map((statement) =>
          statement.id === id ? updater(statement) : statement,
        ),
      }),
      historyGroup,
    );

  const addStatement = () => {
    const id = createBuilderItemId();
    updateTrueFalse((value) => ({
      ...value,
      statements: [...value.statements, { id, text: "" }],
    }));
    focusEditorField(`true-false-statement-${id}`);
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`true-false-instruction-${block.id}`}>
          {t("examBuilder.blocks.trueFalse.instruction")}
        </Label>
        <Textarea
          id={`true-false-instruction-${block.id}`}
          dir="auto"
          value={block.instruction ?? ""}
          placeholder={t("examBuilder.blocks.trueFalse.instructionPlaceholder")}
          onChange={(event) =>
            updateTrueFalse((value) => {
              const updated = { ...value };
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
        aria-labelledby={`true-false-list-${block.id}`}
      >
        <h4 id={`true-false-list-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.trueFalse.statements")}
        </h4>
        {block.statements.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("examBuilder.blocks.trueFalse.empty")}
          </p>
        ) : null}
        <ol className="space-y-3">
          {block.statements.map((statement, index) => {
            const name = t("examBuilder.blocks.trueFalse.statementNumber", {
              number: index + 1,
            });
            const textKey = `block:${block.id}:statement:${statement.id}:text`;
            const pointsKey = `block:${block.id}:statement:${statement.id}:points`;
            return (
              <li
                key={statement.id}
                className="space-y-4 rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold">{name}</h5>
                  <ItemActions
                    name={name}
                    index={index}
                    count={block.statements.length}
                    onMoveUp={() =>
                      updateTrueFalse((value) => ({
                        ...value,
                        statements: moveArrayItem(value.statements, index, -1),
                      }))
                    }
                    onMoveDown={() =>
                      updateTrueFalse((value) => ({
                        ...value,
                        statements: moveArrayItem(value.statements, index, 1),
                      }))
                    }
                    onRemove={() =>
                      updateTrueFalse((value) => ({
                        ...value,
                        statements: value.statements.filter(
                          (candidate) => candidate.id !== statement.id,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <div className="space-y-2">
                    <Label htmlFor={`true-false-statement-${statement.id}`}>
                      {t("examBuilder.blocks.trueFalse.statement")}
                    </Label>
                    <Input
                      id={`true-false-statement-${statement.id}`}
                      dir="auto"
                      value={statement.text}
                      placeholder={t(
                        "examBuilder.blocks.trueFalse.statementPlaceholder",
                      )}
                      onChange={(event) =>
                        updateStatement(
                          statement.id,
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
                  <ValidatedNumberField
                    id={`true-false-points-${statement.id}`}
                    label={t("examBuilder.blocks.trueFalse.points")}
                    value={statement.points}
                    error={t("examBuilder.blocks.fields.pointsError")}
                    min={0}
                    step={0.5}
                    optional
                    isValid={(value) => value >= 0}
                    onValueChange={(points) =>
                      updateStatement(
                        statement.id,
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
        <Button type="button" variant="outline" onClick={addStatement}>
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.trueFalse.addStatement")}
        </Button>
      </section>
    </BlockEditorShell>
  );
}
