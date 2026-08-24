import type { PaginationUnit } from "@/features/exam-renderer/pagination/pagination.types";
import {
  createPaginationUnits,
  splitTextDocumentContent,
} from "@/features/exam-renderer/pagination/create-pagination-units";
import { mergePageUnitsForRender } from "@/features/exam-renderer/pagination/merge-page-units";
import { paginateUnits } from "@/features/exam-renderer/pagination/paginate-exam";
import { createRendererTestExam } from "@/features/exam-renderer/__tests__/renderer.fixtures";

function blockUnit(id: string, height: number): PaginationUnit {
  return {
    id,
    kind: "block",
    block: {
      id,
      type: "instruction",
      startsNewQuestion: false,
      order: 0,
      content: id,
    },
    fragment: { kind: "whole" },
    estimatedHeight: height,
    atomic: true,
  };
}

describe("renderer pagination", () => {
  it("honors explicit page breaks without initial or consecutive blank pages", () => {
    const units: PaginationUnit[] = [
      { id: "initial", kind: "page-break", estimatedHeight: 0 },
      blockUnit("a", 30),
      { id: "break-1", kind: "page-break", estimatedHeight: 0 },
      { id: "break-2", kind: "page-break", estimatedHeight: 0 },
      blockUnit("b", 30),
    ];
    const pages = paginateUnits(units, 100);
    expect(pages).toHaveLength(2);
    expect(pages[0]?.units.map((unit) => unit.id)).toEqual(["a"]);
    expect(pages[1]?.units.map((unit) => unit.id)).toEqual(["b"]);
  });

  it("places a leading section page break before its heading", () => {
    const exam = createRendererTestExam("fr");
    exam.sections = [
      {
        id: "first",
        title: "Première partie",
        blocks: [
          {
            id: "first-content",
            type: "instruction",
            startsNewQuestion: false,
            order: 0,
            content: "A",
          },
        ],
      },
      {
        id: "second",
        title: "Deuxième partie",
        blocks: [
          {
            id: "leading-break",
            type: "page-break",
            startsNewQuestion: false,
            order: 0,
          },
          {
            id: "second-content",
            type: "instruction",
            startsNewQuestion: false,
            order: 1,
            content: "B",
          },
        ],
      },
    ];
    const units = createPaginationUnits(exam);
    expect(units.map((unit) => unit.id)).toEqual([
      "exam-header",
      "section:first",
      "block:first-content",
      "break:leading-break",
      "section:second",
      "block:second-content",
    ]);
    const pages = paginateUnits(units, 1000);
    expect(pages).toHaveLength(2);
    expect(pages[1]?.units.map((unit) => unit.id)).toEqual([
      "section:second",
      "block:second-content",
    ]);
  });

  it("moves a section heading with its first block instead of orphaning it", () => {
    const section = { id: "s", title: "Section", blocks: [] };
    const units: PaginationUnit[] = [
      blockUnit("previous", 75),
      {
        id: "section",
        kind: "section-heading",
        section,
        estimatedHeight: 20,
        keepWithNext: true,
      },
      blockUnit("first", 30),
    ];
    const pages = paginateUnits(units, 100);
    expect(pages).toHaveLength(2);
    expect(pages[1]?.units.map((unit) => unit.id)).toEqual([
      "section",
      "first",
    ]);
  });

  it("uses measured heights and never loses an oversized atomic unit", () => {
    const units = [blockUnit("a", 20), blockUnit("matching", 20)];
    const pages = paginateUnits(
      units,
      100,
      new Map([
        ["a", 80],
        ["matching", 70],
      ]),
    );
    expect(pages).toHaveLength(2);
    expect(pages.flatMap((page) => page.units.map((unit) => unit.id))).toEqual([
      "a",
      "matching",
    ]);
  });

  it("moves a measured image atomically to the next page", () => {
    const exam = createRendererTestExam("fr");
    const image = exam.sections[0]!.blocks.find(
      (block) => block.type === "image",
    )!;
    exam.sections[0]!.blocks = [
      {
        id: "intro",
        type: "instruction",
        startsNewQuestion: false,
        order: 0,
        content: "Introduction",
      },
      image,
    ];
    const units = createPaginationUnits(exam);
    const pages = paginateUnits(
      units,
      500,
      new Map([
        ["exam-header", 250],
        ["section:history", 50],
        ["block:intro", 100],
        ["block:image", 220],
      ]),
    );
    expect(pages).toHaveLength(2);
    expect(pages[0]?.units.map((unit) => unit.id)).not.toContain("block:image");
    expect(pages[1]?.units.map((unit) => unit.id)).toEqual(["block:image"]);
  });

  it("fragments long documents and large tables without losing rows", () => {
    const exam = createRendererTestExam();
    const document = exam.sections[0]!.blocks.find(
      (block) => block.type === "text-document",
    )!;
    const table = exam.sections[0]!.blocks.find(
      (block) => block.type === "table",
    )!;
    if (document.type !== "text-document" || table.type !== "table")
      throw new Error("fixture mismatch");
    document.content = "نص طويل ".repeat(500);
    table.rows = Array.from({ length: 40 }, (_, rowIndex) => ({
      id: `row-${rowIndex}`,
      cells: table.columns.map((column) => ({
        columnId: column.id,
        value: `${rowIndex}`,
      })),
    }));
    const units = createPaginationUnits(exam);
    expect(
      units.filter((unit) => unit.id.includes(":text:")).length,
    ).toBeGreaterThan(1);
    const tableUnits = units.filter((unit) => unit.id.includes(":table:"));
    expect(tableUnits).toHaveLength(40);
    const pages = paginateUnits(units, 650);
    expect(pages.length).toBeGreaterThan(1);
    expect(
      pages
        .flatMap((page) => page.units)
        .filter((unit) => unit.kind === "block").length,
    ).toBe(units.filter((unit) => unit.kind === "block").length);

    const renderedTableUnits = pages
      .flatMap((page) => mergePageUnitsForRender(page.units))
      .filter(
        (unit) => unit.kind === "block" && unit.fragment.kind === "table",
      );
    const renderedRows = renderedTableUnits.flatMap((unit) =>
      unit.kind === "block" && unit.fragment.kind === "table"
        ? unit.fragment.rows
        : [],
    );
    expect(renderedRows.map((row) => row.id)).toEqual(
      table.rows.map((row) => row.id),
    );
    expect(
      renderedTableUnits.filter(
        (unit) =>
          unit.kind === "block" &&
          unit.fragment.kind === "table" &&
          unit.fragment.showPoints,
      ),
    ).toHaveLength(1);
  });

  it("splits text at paragraph and sentence boundaries deterministically", () => {
    const text =
      "Première phrase complète. Deuxième phrase complète.\n\nفقرة عربية أولى؟ فقرة عربية ثانية طويلة بعض الشيء.";
    const first = splitTextDocumentContent(text, 45);
    const second = splitTextDocumentContent(text, 45);
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(1);
    expect(first.slice(0, -1).every((part) => /[.!?؟]$/u.test(part))).toBe(
      true,
    );
    expect(first.join(" ").replace(/\s+/g, " ")).toBe(
      text.replace(/\s+/g, " "),
    );
  });

  it("reserves a repeated table header once on every physical page", () => {
    const exam = createRendererTestExam("fr");
    const table = exam.sections[0]!.blocks.find(
      (block) => block.type === "table",
    )!;
    if (table.type !== "table") throw new Error("fixture mismatch");
    table.rows = Array.from({ length: 3 }, (_, index) => ({
      id: `row-${index}`,
      cells: table.columns.map((column) => ({
        columnId: column.id,
        value: String(index),
      })),
    }));
    exam.sections[0]!.blocks = [table];
    const tableUnits = createPaginationUnits(exam).filter(
      (unit) => unit.kind === "block",
    );
    const measurements = new Map<string, number>([
      ["exam-header", 1],
      ["section:history", 1],
      ["table-header:table", 30],
      ...tableUnits.map((unit) => [unit.id, 20] as const),
    ]);
    const pages = paginateUnits(createPaginationUnits(exam), 65, measurements);
    expect(pages).toHaveLength(3);
    expect(
      pages.map(
        (page) => page.units.filter((unit) => unit.kind === "block").length,
      ),
    ).toEqual([1, 1, 1]);
  });

  it("fragments definitions by complete item and keeps labels at the edges", () => {
    const exam = createRendererTestExam();
    const definition = exam.sections[0]!.blocks.find(
      (block) => block.type === "definition",
    )!;
    if (definition.type !== "definition") throw new Error("fixture mismatch");
    definition.items = [
      ...definition.items,
      { id: "term-2", term: "المواطنة", answerLines: 2 },
      { id: "term-3", term: "التضامن", answerLines: 3 },
    ];
    definition.points = 3;
    exam.sections[0]!.blocks = [definition];
    const units = createPaginationUnits(exam).filter(
      (unit) => unit.kind === "block",
    );
    expect(units).toHaveLength(3);
    expect(
      units.map((unit) =>
        unit.kind === "block" && unit.fragment.kind === "definition"
          ? [
              unit.fragment.items[0]?.id,
              unit.fragment.showInstruction,
              unit.fragment.showBlockPoints,
            ]
          : null,
      ),
    ).toEqual([
      ["term", true, false],
      ["term-2", false, false],
      ["term-3", false, true],
    ]);
  });

  it("produces a header page for an empty exam", () => {
    const exam = createRendererTestExam();
    exam.sections = [];
    const pages = paginateUnits(createPaginationUnits(exam), 1000);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.units[0]?.kind).toBe("header");
  });
});
