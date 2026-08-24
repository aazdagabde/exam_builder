import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FillBlankBlock, FillBlankSegment } from "@/domain/exam";
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

export function FillBlankBlockEditor({ block }: { block: FillBlankBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const instructionKey = `block:${block.id}:instruction`;

  const updateFillBlank = (
    updater: (value: FillBlankBlock) => FillBlankBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "fill-blank" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateSegment = (
    index: number,
    updater: (segment: FillBlankSegment) => FillBlankSegment,
    historyGroup?: string,
  ) =>
    updateFillBlank(
      (value) => ({
        ...value,
        segments: value.segments.map((segment, candidateIndex) =>
          candidateIndex === index ? updater(segment) : segment,
        ),
      }),
      historyGroup,
    );

  const addText = () => {
    const index = block.segments.length;
    updateFillBlank((value) => ({
      ...value,
      segments: [...value.segments, { type: "text", value: "" }],
    }));
    focusEditorField(`fill-blank-text-${block.id}-${index}`);
  };

  const addBlank = () => {
    const id = createBuilderItemId();
    updateFillBlank((value) => ({
      ...value,
      segments: [...value.segments, { type: "blank", id }],
    }));
    focusEditorField(`fill-blank-width-${id}`);
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`fill-blank-instruction-${block.id}`}>
          {t("examBuilder.blocks.fillBlank.instruction")}
        </Label>
        <Textarea
          id={`fill-blank-instruction-${block.id}`}
          dir="auto"
          value={block.instruction ?? ""}
          placeholder={t("examBuilder.blocks.fillBlank.instructionPlaceholder")}
          onChange={(event) =>
            updateFillBlank((value) => {
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
        <BlockPointsField blockId={block.id} value={block.points} />
      </div>

      <section
        className="space-y-3"
        aria-labelledby={`fill-blank-segments-${block.id}`}
      >
        <h4 id={`fill-blank-segments-${block.id}`} className="font-medium">
          {t("examBuilder.blocks.fillBlank.segments")}
        </h4>
        {block.segments.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("examBuilder.blocks.fillBlank.empty")}
          </p>
        ) : null}
        <ol className="space-y-3">
          {block.segments.map((segment, index) => {
            const name = t("examBuilder.blocks.fillBlank.segmentNumber", {
              number: index + 1,
            });
            const textKey = `block:${block.id}:segment:${index}:text`;
            const widthKey = `block:${block.id}:blank:${segment.type === "blank" ? segment.id : index}:width`;
            return (
              <li
                key={segment.type === "blank" ? segment.id : `text-${index}`}
                className="space-y-4 rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-semibold">{name}</h5>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {t(
                        segment.type === "text"
                          ? "examBuilder.blocks.fillBlank.textSegment"
                          : "examBuilder.blocks.fillBlank.blankSegment",
                      )}
                    </span>
                  </div>
                  <ItemActions
                    name={name}
                    index={index}
                    count={block.segments.length}
                    onMoveUp={() =>
                      updateFillBlank((value) => ({
                        ...value,
                        segments: moveArrayItem(value.segments, index, -1),
                      }))
                    }
                    onMoveDown={() =>
                      updateFillBlank((value) => ({
                        ...value,
                        segments: moveArrayItem(value.segments, index, 1),
                      }))
                    }
                    onRemove={() =>
                      updateFillBlank((value) => ({
                        ...value,
                        segments: value.segments.filter(
                          (_, candidateIndex) => candidateIndex !== index,
                        ),
                      }))
                    }
                  />
                </div>

                {segment.type === "text" ? (
                  <div className="space-y-2">
                    <Label htmlFor={`fill-blank-text-${block.id}-${index}`}>
                      {t("examBuilder.blocks.fillBlank.text")}
                    </Label>
                    <Input
                      id={`fill-blank-text-${block.id}-${index}`}
                      dir="auto"
                      value={segment.value}
                      placeholder={t(
                        "examBuilder.blocks.fillBlank.textPlaceholder",
                      )}
                      onChange={(event) =>
                        updateSegment(
                          index,
                          (candidate) =>
                            candidate.type === "text"
                              ? { ...candidate, value: event.target.value }
                              : candidate,
                          textKey,
                        )
                      }
                      onBlur={() => endHistoryGroup(textKey)}
                    />
                  </div>
                ) : (
                  <div className="max-w-xs">
                    <ValidatedNumberField
                      id={`fill-blank-width-${segment.id}`}
                      label={t("examBuilder.blocks.fillBlank.width")}
                      value={segment.width}
                      error={t("examBuilder.blocks.fillBlank.widthError")}
                      min={0.1}
                      step={0.5}
                      optional
                      isValid={(value) => value > 0}
                      onValueChange={(width) =>
                        updateSegment(
                          index,
                          (candidate) => {
                            if (candidate.type !== "blank") return candidate;
                            const updated = { ...candidate };
                            if (width === undefined) delete updated.width;
                            else updated.width = width;
                            return updated;
                          },
                          widthKey,
                        )
                      }
                      onEditEnd={() => endHistoryGroup(widthKey)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addText}>
            <Plus aria-hidden="true" />
            {t("examBuilder.blocks.fillBlank.addText")}
          </Button>
          <Button type="button" variant="outline" onClick={addBlank}>
            <Plus aria-hidden="true" />
            {t("examBuilder.blocks.fillBlank.addBlank")}
          </Button>
        </div>
      </section>
    </BlockEditorShell>
  );
}
