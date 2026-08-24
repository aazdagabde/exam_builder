import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionAnswerMode, QuestionBlock } from "@/domain/exam";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { ValidatedNumberField } from "@/features/exam-builder/components/block-editors/ValidatedNumberField";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

const DEFAULT_ANSWER_LINES = 3;

export function QuestionBlockEditor({ block }: { block: QuestionBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const questionHistoryKey = `block:${block.id}:question`;
  const linesHistoryKey = `block:${block.id}:answerLines`;

  const updateQuestion = (
    updater: (question: QuestionBlock) => QuestionBlock,
    historyGroup?: string,
  ) => {
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "question" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );
  };

  const handleAnswerModeChange = (answerMode: QuestionAnswerMode) => {
    updateQuestion((question) => {
      if (answerMode === "none") {
        const updated = { ...question, answerMode };
        delete updated.answerLines;
        return updated;
      }
      if (answerMode === "lines") {
        return {
          ...question,
          answerMode,
          answerLines: question.answerLines ?? DEFAULT_ANSWER_LINES,
        };
      }
      return { ...question, answerMode };
    });
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="space-y-2">
        <Label htmlFor={`question-${block.id}`}>
          {t("examBuilder.blocks.questionEditor.question")}
        </Label>
        <Textarea
          id={`question-${block.id}`}
          dir="auto"
          value={block.question}
          placeholder={t(
            "examBuilder.blocks.questionEditor.questionPlaceholder",
          )}
          onChange={(event) =>
            updateQuestion(
              (question) => ({
                ...question,
                question: event.target.value,
              }),
              questionHistoryKey,
            )
          }
          onBlur={() => endHistoryGroup(questionHistoryKey)}
        />
        {block.question.trim() === "" ? (
          <p className="text-xs text-amber-700" role="status">
            {t("examBuilder.blocks.questionEditor.emptyWarning")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <BlockPointsField blockId={block.id} value={block.points} />

        <div className="space-y-2">
          <Label htmlFor={`question-mode-${block.id}`}>
            {t("examBuilder.blocks.questionEditor.answerMode")}
          </Label>
          <NativeSelect
            id={`question-mode-${block.id}`}
            value={block.answerMode}
            onChange={(event) =>
              handleAnswerModeChange(event.target.value as QuestionAnswerMode)
            }
          >
            <option value="none">
              {t("examBuilder.blocks.questionEditor.modes.none")}
            </option>
            <option value="lines">
              {t("examBuilder.blocks.questionEditor.modes.lines")}
            </option>
            <option value="box">
              {t("examBuilder.blocks.questionEditor.modes.box")}
            </option>
          </NativeSelect>
        </div>
      </div>

      {block.answerMode === "lines" ? (
        <div className="max-w-xs">
          <ValidatedNumberField
            id={`question-lines-${block.id}`}
            label={t("examBuilder.blocks.questionEditor.answerLines")}
            value={block.answerLines}
            error={t("examBuilder.blocks.questionEditor.answerLinesError")}
            min={1}
            step={1}
            optional={false}
            isValid={(value) => Number.isInteger(value) && value > 0}
            onValueChange={(answerLines) => {
              if (answerLines !== undefined) {
                updateQuestion(
                  (question) => ({ ...question, answerLines }),
                  linesHistoryKey,
                );
              }
            }}
            onEditEnd={() => endHistoryGroup(linesHistoryKey)}
          />
        </div>
      ) : null}
    </BlockEditorShell>
  );
}
