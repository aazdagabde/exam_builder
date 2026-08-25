import type { ExamBlock } from "@/domain/exam";

export type BlockSummary =
  | { kind: "text"; text: string }
  | {
      kind: "count";
      count: number;
      item:
        | "terms"
        | "statements"
        | "options"
        | "blanks"
        | "pairs"
        | "topics"
        | "events";
    }
  | { kind: "table"; columns: number; rows: number }
  | {
      kind: "chart";
      chartType: "bar" | "line" | "pie";
      categories: number;
    }
  | { kind: "none" };

function firstText(...values: Array<string | undefined>): BlockSummary {
  const text = values.find((value) => value?.trim())?.trim();
  return text ? { kind: "text", text } : { kind: "none" };
}

/** Returns only Domain-derived data; localization stays in the React layer. */
export function getBlockSummary(block: ExamBlock): BlockSummary {
  switch (block.type) {
    case "instruction":
      return firstText(block.content);
    case "text-document":
      return firstText(block.title, block.content);
    case "image":
      return firstText(block.title, block.caption, block.source);
    case "question":
      return firstText(block.question);
    case "definition":
      return { kind: "count", count: block.items.length, item: "terms" };
    case "true-false":
      return {
        kind: "count",
        count: block.statements.length,
        item: "statements",
      };
    case "multiple-choice":
      return block.question.trim()
        ? { kind: "text", text: block.question.trim() }
        : { kind: "count", count: block.options.length, item: "options" };
    case "fill-blank":
      return {
        kind: "count",
        count: block.segments.filter((segment) => segment.type === "blank")
          .length,
        item: "blanks",
      };
    case "table":
      return {
        kind: "table",
        columns: block.columns.length,
        rows: block.rows.length,
      };
    case "matching":
      return {
        kind: "count",
        count: Math.max(block.leftItems.length, block.rightItems.length),
        item: "pairs",
      };
    case "timeline":
      return { kind: "count", count: block.events.length, item: "events" };
    case "chart":
      return {
        kind: "chart",
        chartType: block.chartType,
        categories: block.labels.length,
      };
    case "essay":
      return block.instruction.trim()
        ? { kind: "text", text: block.instruction.trim() }
        : { kind: "count", count: block.topics.length, item: "topics" };
    case "free-text":
      return firstText(block.content);
    case "separator":
    case "page-break":
      return { kind: "none" };
  }
}
