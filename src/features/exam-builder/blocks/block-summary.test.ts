// @vitest-environment node

import { allBlockExamples } from "@/domain/exam/__tests__/exam.fixtures";
import { getBlockSummary } from "@/features/exam-builder/blocks/block-summary";

describe("getBlockSummary", () => {
  it("extracts question text without adding a localized fallback", () => {
    const question = allBlockExamples.find(
      (block) => block.type === "question",
    )!;

    expect(getBlockSummary(question)).toEqual({
      kind: "text",
      text: "Explain the event",
    });
  });

  it("returns dimensions for a table", () => {
    const table = allBlockExamples.find((block) => block.type === "table")!;
    expect(getBlockSummary(table)).toEqual({
      kind: "table",
      columns: 1,
      rows: 1,
    });
  });

  it("returns no content for page breaks", () => {
    const pageBreak = allBlockExamples.find(
      (block) => block.type === "page-break",
    )!;
    expect(getBlockSummary(pageBreak)).toEqual({ kind: "none" });
  });
});
