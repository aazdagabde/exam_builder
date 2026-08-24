import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TextDocumentBlock } from "@/domain/exam";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

type OptionalTextField = "instruction" | "title" | "source" | "reference";

export function TextDocumentBlockEditor({
  block,
}: {
  block: TextDocumentBlock;
}) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);

  const updateOptionalText = (field: OptionalTextField, value: string) => {
    const historyKey = `block:${block.id}:${field}`;
    updateBlock(
      block.id,
      (candidate) => {
        if (candidate.type !== "text-document") return candidate;
        const updated = { ...candidate };
        if (value === "") delete updated[field];
        else updated[field] = value;
        return updated;
      },
      { historyGroup: historyKey },
    );
  };

  const optionalField = (field: OptionalTextField, multiline = false) => {
    const id = `text-document-${field}-${block.id}`;
    const historyKey = `block:${block.id}:${field}`;
    const props = {
      id,
      dir: "auto" as const,
      value: block[field] ?? "",
      placeholder: t(`examBuilder.blocks.textDocument.placeholders.${field}`),
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateOptionalText(field, event.target.value),
      onBlur: () => endHistoryGroup(historyKey),
    };
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {t(`examBuilder.blocks.textDocument.${field}`)}
        </Label>
        {multiline ? <Textarea {...props} /> : <Input {...props} />}
      </div>
    );
  };

  const contentHistoryKey = `block:${block.id}:content`;

  return (
    <BlockEditorShell type={block.type}>
      {optionalField("instruction", true)}
      {optionalField("title")}
      <div className="space-y-2">
        <Label htmlFor={`text-document-content-${block.id}`}>
          {t("examBuilder.blocks.textDocument.content")}
        </Label>
        <Textarea
          id={`text-document-content-${block.id}`}
          className="min-h-40"
          dir="auto"
          value={block.content}
          placeholder={t(
            "examBuilder.blocks.textDocument.placeholders.content",
          )}
          onChange={(event) =>
            updateBlock(
              block.id,
              (candidate) =>
                candidate.type === "text-document"
                  ? { ...candidate, content: event.target.value }
                  : candidate,
              { historyGroup: contentHistoryKey },
            )
          }
          onBlur={() => endHistoryGroup(contentHistoryKey)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {optionalField("source")}
        {optionalField("reference")}
      </div>
      <BooleanField
        id={`text-document-bordered-${block.id}`}
        label={t("examBuilder.blocks.textDocument.bordered")}
        checked={block.bordered ?? false}
        onCheckedChange={(bordered) =>
          updateBlock(block.id, (candidate) =>
            candidate.type === "text-document"
              ? { ...candidate, bordered }
              : candidate,
          )
        }
      />
      <div className="max-w-xs">
        <BlockPointsField blockId={block.id} value={block.points} />
      </div>
    </BlockEditorShell>
  );
}
