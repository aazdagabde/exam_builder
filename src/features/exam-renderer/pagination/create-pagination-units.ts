import type {
  DefinitionBlock,
  Exam,
  ExamBlock,
  TextDocumentBlock,
} from "@/domain/exam";

import {
  TABLE_HEADER_ESTIMATED_HEIGHT_PX,
  TABLE_HEADER_MEASUREMENT_PREFIX,
  TEXT_DOCUMENT_CHUNK_SIZE,
} from "@/features/exam-renderer/pagination/pagination.constants";
import type {
  PaginationUnit,
  TextDocumentFragment,
} from "@/features/exam-renderer/pagination/pagination.types";

function splitOversizedSegment(
  segment: string,
  maximumLength: number,
): string[] {
  const parts: string[] = [];
  let remainder = segment.trim();
  while (remainder.length > maximumLength) {
    const candidate = remainder.slice(0, maximumLength + 1);
    const breakAt = candidate.lastIndexOf(" ");
    const splitAt = breakAt > maximumLength / 2 ? breakAt : maximumLength;
    parts.push(remainder.slice(0, splitAt).trim());
    remainder = remainder.slice(splitAt).trimStart();
  }
  if (remainder) parts.push(remainder);
  return parts;
}

function splitParagraph(paragraph: string, maximumLength: number): string[] {
  if (paragraph.length <= maximumLength) return [paragraph];
  const sentences = paragraph.match(/[^.!?؟]+(?:[.!?؟]+|$)/gu) ?? [paragraph];
  const parts: string[] = [];
  let current = "";

  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;
    if (sentence.length > maximumLength) {
      if (current) {
        parts.push(current);
        current = "";
      }
      parts.push(...splitOversizedSegment(sentence, maximumLength));
      continue;
    }
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maximumLength && current) {
      parts.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function splitTextDocumentContent(
  text: string,
  maximumLength = TEXT_DOCUMENT_CHUNK_SIZE,
): string[] {
  if (text.length <= maximumLength) return [text];

  const logicalParts = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitParagraph(paragraph.trim(), maximumLength))
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";
  for (const part of logicalParts) {
    const separator = current ? "\n\n" : "";
    const candidate = `${current}${separator}${part}`;
    if (candidate.length > maximumLength && current) {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}

function createTextDocumentUnits(block: TextDocumentBlock): PaginationUnit[] {
  const parts = splitTextDocumentContent(block.content);
  return parts.map((content, index) => {
    const position =
      parts.length === 1
        ? "single"
        : index === 0
          ? "start"
          : index === parts.length - 1
            ? "end"
            : "middle";
    const fragment: TextDocumentFragment = {
      kind: "text-document",
      content,
      showIntroduction: index === 0,
      showReferences: index === parts.length - 1,
      position,
    };
    return {
      id: `block:${block.id}:text:${index}`,
      kind: "block",
      block,
      fragment,
      estimatedHeight: 72 + Math.ceil(content.length / 90) * 18,
      atomic: false,
    };
  });
}

function createDefinitionUnits(block: DefinitionBlock): PaginationUnit[] {
  return block.items.map((item, index) => ({
    id: `block:${block.id}:definition:${item.id}`,
    kind: "block",
    block,
    fragment: {
      kind: "definition",
      items: [item],
      showInstruction: index === 0,
      showBlockPoints: index === block.items.length - 1,
    },
    estimatedHeight:
      (index === 0 && block.instruction?.trim() ? 34 : 0) +
      30 +
      item.answerLines * 25,
    atomic: true,
  }));
}

function estimateWholeBlockHeight(block: ExamBlock): number {
  switch (block.type) {
    case "instruction":
    case "free-text":
      return 34 + Math.ceil(block.content.length / 90) * 18;
    case "image":
      return 320;
    case "question":
      return (
        45 + (block.answerMode === "none" ? 0 : (block.answerLines ?? 4) * 28)
      );
    case "definition":
      return (
        38 +
        block.items.reduce(
          (height, item) => height + 30 + item.answerLines * 25,
          0,
        )
      );
    case "true-false":
      return 70 + block.statements.length * 38;
    case "multiple-choice":
      return 48 + block.options.length * 28;
    case "fill-blank":
      return 55 + Math.ceil(block.segments.length / 4) * 25;
    case "matching":
      return (
        50 + Math.max(block.leftItems.length, block.rightItems.length) * 42
      );
    case "timeline":
      return block.orientation === "vertical"
        ? 55 + block.events.length * 72
        : 145 + Math.max(0, block.events.length - 6) * 12;
    case "chart":
      return 390;
    case "essay":
      return 80 + block.topics.length * 32;
    case "separator":
      return block.style === "space" ? 28 : 16;
    case "page-break":
      return 0;
    case "table":
    case "text-document":
      return 80;
  }
}

function createBlockUnits(block: ExamBlock): PaginationUnit[] {
  if (block.type === "page-break") {
    return [
      { id: `break:${block.id}`, kind: "page-break", estimatedHeight: 0 },
    ];
  }
  if (block.type === "text-document") return createTextDocumentUnits(block);
  if (block.type === "definition") return createDefinitionUnits(block);
  if (block.type === "table") {
    if (block.rows.length === 0) {
      return [
        {
          id: `block:${block.id}:table:empty`,
          kind: "block",
          block,
          fragment: {
            kind: "table",
            rows: [],
            showPoints: true,
            showQuestionNumber: true,
          },
          estimatedHeight: block.showHeader ? 72 : 42,
          atomic: true,
        },
      ];
    }
    return block.rows.map((row, index) => {
      const tableGroupId = `table:${block.id}`;
      return {
        id: `block:${block.id}:table:${index}`,
        kind: "block",
        block,
        fragment: {
          kind: "table",
          rows: [row],
          showPoints: index === block.rows.length - 1,
          showQuestionNumber: index === 0,
        },
        estimatedHeight: 42,
        atomic: false,
        pageGroup: block.showHeader
          ? {
              id: tableGroupId,
              overheadMeasurementKey: `${TABLE_HEADER_MEASUREMENT_PREFIX}${block.id}`,
              estimatedOverhead: TABLE_HEADER_ESTIMATED_HEIGHT_PX,
            }
          : undefined,
      } satisfies PaginationUnit;
    });
  }
  return [
    {
      id: `block:${block.id}`,
      kind: "block",
      block,
      fragment: { kind: "whole" },
      estimatedHeight: estimateWholeBlockHeight(block),
      atomic: true,
    },
  ];
}

export function createPaginationUnits(exam: Exam): PaginationUnit[] {
  const units: PaginationUnit[] = [
    { id: "exam-header", kind: "header", estimatedHeight: 250 },
  ];
  for (const section of exam.sections) {
    const firstContentIndex = section.blocks.findIndex(
      (block) => block.type !== "page-break",
    );
    const leadingBreakCount =
      firstContentIndex === -1 ? section.blocks.length : firstContentIndex;
    for (const block of section.blocks.slice(0, leadingBreakCount)) {
      units.push(...createBlockUnits(block));
    }
    units.push({
      id: `section:${section.id}`,
      kind: "section-heading",
      section,
      estimatedHeight: 50,
      keepWithNext: true,
    });
    for (const block of section.blocks.slice(leadingBreakCount)) {
      units.push(...createBlockUnits(block));
    }
  }
  return units;
}
