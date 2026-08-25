import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { canBlockStartQuestion, type ExamBlock } from "@/domain/exam";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { ChartBlockEditor } from "@/features/exam-builder/components/block-editors/ChartBlockEditor";
import { DefinitionBlockEditor } from "@/features/exam-builder/components/block-editors/DefinitionBlockEditor";
import { DiagramBlockEditor } from "@/features/exam-builder/components/block-editors/DiagramBlockEditor";
import { FillBlankBlockEditor } from "@/features/exam-builder/components/block-editors/FillBlankBlockEditor";
import { FreeTextBlockEditor } from "@/features/exam-builder/components/block-editors/FreeTextBlockEditor";
import { InstructionBlockEditor } from "@/features/exam-builder/components/block-editors/InstructionBlockEditor";
import { ImageBlockEditor } from "@/features/exam-builder/components/block-editors/ImageBlockEditor";
import { EssayBlockEditor } from "@/features/exam-builder/components/block-editors/EssayBlockEditor";
import { MatchingBlockEditor } from "@/features/exam-builder/components/block-editors/MatchingBlockEditor";
import { MultipleChoiceBlockEditor } from "@/features/exam-builder/components/block-editors/MultipleChoiceBlockEditor";
import { TextDocumentBlockEditor } from "@/features/exam-builder/components/block-editors/TextDocumentBlockEditor";
import { TimelineBlockEditor } from "@/features/exam-builder/components/block-editors/TimelineBlockEditor";
import { TableBlockEditor } from "@/features/exam-builder/components/block-editors/TableBlockEditor";
import { TrueFalseBlockEditor } from "@/features/exam-builder/components/block-editors/TrueFalseBlockEditor";
import { QuestionBlockEditor } from "@/features/exam-builder/components/QuestionBlockEditor";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

function assertNever(block: never): never {
  throw new Error(`Unsupported block type: ${JSON.stringify(block)}`);
}

function SimpleBlockEditor({
  block,
  messageKey,
}: {
  block: ExamBlock;
  messageKey:
    "examBuilder.blocks.noSettings" | "examBuilder.blocks.pageBreakInfo";
}) {
  const { t } = useTranslation();

  return (
    <BlockEditorShell type={block.type}>
      <p className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
        {t(messageKey)}
      </p>
    </BlockEditorShell>
  );
}

function RoutedBlockEditor({ block }: { block: ExamBlock }) {
  switch (block.type) {
    case "instruction":
      return <InstructionBlockEditor block={block} />;
    case "text-document":
      return <TextDocumentBlockEditor block={block} />;
    case "image":
      return <ImageBlockEditor block={block} />;
    case "question":
      return <QuestionBlockEditor block={block} />;
    case "definition":
      return <DefinitionBlockEditor block={block} />;
    case "true-false":
      return <TrueFalseBlockEditor block={block} />;
    case "multiple-choice":
      return <MultipleChoiceBlockEditor block={block} />;
    case "fill-blank":
      return <FillBlankBlockEditor block={block} />;
    case "table":
      return <TableBlockEditor block={block} />;
    case "matching":
      return <MatchingBlockEditor block={block} />;
    case "timeline":
      return <TimelineBlockEditor block={block} />;
    case "chart":
      return <ChartBlockEditor block={block} />;
    case "diagram":
      return <DiagramBlockEditor block={block} />;
    case "essay":
      return <EssayBlockEditor block={block} />;
    case "free-text":
      return <FreeTextBlockEditor block={block} />;
    case "separator":
      return (
        <SimpleBlockEditor
          block={block}
          messageKey="examBuilder.blocks.noSettings"
        />
      );
    case "page-break":
      return (
        <SimpleBlockEditor
          block={block}
          messageKey="examBuilder.blocks.pageBreakInfo"
        />
      );
    default:
      return assertNever(block);
  }
}

export function BlockEditor() {
  const { t } = useTranslation();
  const block = useExamBuilderStore((state) => {
    const section = state.exam?.sections.find(
      (candidate) => candidate.id === state.selectedSectionId,
    );
    return section?.blocks.find(
      (candidate) => candidate.id === state.selectedBlockId,
    );
  });

  if (!block) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {t("examBuilder.blocks.selectBlock")}
      </div>
    );
  }

  return <SelectedBlockEditor key={block.id} block={block} />;
}

function SelectedBlockEditor({ block }: { block: ExamBlock }) {
  const { t } = useTranslation();
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={containerRef} tabIndex={-1} className="space-y-4 outline-none">
      {canBlockStartQuestion(block.type) ? (
        <fieldset className="rounded-lg border bg-muted/20 p-4">
          <legend className="px-1 text-sm font-semibold">
            {t("examBuilder.blocks.organization.title")}
          </legend>
          <label className="flex min-w-0 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              checked={block.startsNewQuestion === true}
              onChange={(event) =>
                updateBlock(block.id, (candidate) => {
                  if (
                    candidate.type === "separator" ||
                    candidate.type === "page-break"
                  ) {
                    return candidate;
                  }
                  return {
                    ...candidate,
                    startsNewQuestion: event.target.checked,
                  };
                })
              }
            />
            <span className="min-w-0">
              <span className="block font-medium">
                {t("examBuilder.blocks.organization.startsNewQuestion")}
              </span>
              <span className="mt-1 block leading-5 text-muted-foreground">
                {t("examBuilder.blocks.organization.help")}
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}
      <RoutedBlockEditor block={block} />
    </div>
  );
}
