import type { ExamBlock } from "@/domain/exam";
import type { ResolvedImageAssets } from "@/features/exam-renderer/assets/renderer-assets";
import { DefinitionRenderer } from "@/features/exam-renderer/components/blocks/DefinitionRenderer";
import { ChartRenderer } from "@/features/exam-renderer/components/blocks/ChartRenderer";
import { EssayRenderer } from "@/features/exam-renderer/components/blocks/EssayRenderer";
import { FillBlankRenderer } from "@/features/exam-renderer/components/blocks/FillBlankRenderer";
import { FreeTextRenderer } from "@/features/exam-renderer/components/blocks/FreeTextRenderer";
import { ImageRenderer } from "@/features/exam-renderer/components/blocks/ImageRenderer";
import { InstructionRenderer } from "@/features/exam-renderer/components/blocks/InstructionRenderer";
import { MatchingRenderer } from "@/features/exam-renderer/components/blocks/MatchingRenderer";
import { MultipleChoiceRenderer } from "@/features/exam-renderer/components/blocks/MultipleChoiceRenderer";
import { PageBreakRenderer } from "@/features/exam-renderer/components/blocks/PageBreakRenderer";
import { QuestionRenderer } from "@/features/exam-renderer/components/blocks/QuestionRenderer";
import { SeparatorRenderer } from "@/features/exam-renderer/components/blocks/SeparatorRenderer";
import { TableRenderer } from "@/features/exam-renderer/components/blocks/TableRenderer";
import { TimelineRenderer } from "@/features/exam-renderer/components/blocks/TimelineRenderer";
import { TextDocumentRenderer } from "@/features/exam-renderer/components/blocks/TextDocumentRenderer";
import { TrueFalseRenderer } from "@/features/exam-renderer/components/blocks/TrueFalseRenderer";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";
import type { BlockFragment } from "@/features/exam-renderer/pagination/pagination.types";

export function BlockRenderer({
  block,
  fragment = { kind: "whole" },
  labels,
  assets,
  onContentLoad,
  questionNumber,
  showQuestionNumber = true,
}: {
  block: ExamBlock;
  fragment?: BlockFragment;
  labels: DocumentLabels;
  assets: ResolvedImageAssets;
  onContentLoad?(): void;
  questionNumber?: number;
  showQuestionNumber?: boolean;
}) {
  const content = renderBlockContent(
    block,
    fragment,
    labels,
    assets,
    onContentLoad,
  );
  if (questionNumber === undefined || !showQuestionNumber) return content;

  return (
    <div className="exam-numbered-block" data-question-number={questionNumber}>
      <span className="exam-question-number" dir="ltr" aria-hidden="true">
        {questionNumber}-
      </span>
      <div className="exam-numbered-block__content">{content}</div>
    </div>
  );
}

function renderBlockContent(
  block: ExamBlock,
  fragment: BlockFragment,
  labels: DocumentLabels,
  assets: ResolvedImageAssets,
  onContentLoad?: () => void,
) {
  switch (block.type) {
    case "instruction":
      return <InstructionRenderer block={block} />;
    case "text-document":
      return (
        <TextDocumentRenderer
          block={block}
          labels={labels}
          fragment={fragment.kind === "text-document" ? fragment : undefined}
        />
      );
    case "image":
      return (
        <ImageRenderer
          block={block}
          labels={labels}
          asset={assets.get(block.imageId)}
          onLoad={onContentLoad}
        />
      );
    case "question":
      return <QuestionRenderer block={block} labels={labels} />;
    case "definition":
      return (
        <DefinitionRenderer
          block={block}
          labels={labels}
          fragment={fragment.kind === "definition" ? fragment : undefined}
        />
      );
    case "true-false":
      return <TrueFalseRenderer block={block} labels={labels} />;
    case "multiple-choice":
      return <MultipleChoiceRenderer block={block} labels={labels} />;
    case "fill-blank":
      return <FillBlankRenderer block={block} labels={labels} />;
    case "table":
      return (
        <TableRenderer
          block={block}
          labels={labels}
          rows={fragment.kind === "table" ? fragment.rows : undefined}
          showPoints={
            fragment.kind === "table" ? fragment.showPoints : undefined
          }
        />
      );
    case "matching":
      return <MatchingRenderer block={block} labels={labels} />;
    case "timeline":
      return <TimelineRenderer block={block} labels={labels} />;
    case "chart":
      return <ChartRenderer block={block} labels={labels} />;
    case "essay":
      return <EssayRenderer block={block} labels={labels} />;
    case "free-text":
      return <FreeTextRenderer block={block} />;
    case "separator":
      return <SeparatorRenderer block={block} />;
    case "page-break":
      return <PageBreakRenderer block={block} />;
    default:
      return assertNever(block);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported exam block: ${JSON.stringify(value)}`);
}
