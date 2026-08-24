import {
  calculateTwoUpScale,
  createPrintImposition,
  getPhysicalSheetCount,
  installPrintPageStyle,
} from "@/features/export-pdf/services/print-imposition";

function createPrintRoot(pageCount: number): HTMLElement {
  const root = document.createElement("div");
  const pages = document.createElement("div");
  pages.className = "exam-pages";
  for (let page = 1; page <= pageCount; page += 1) {
    const article = document.createElement("article");
    article.className = "exam-page";
    article.dataset.pageNumber = String(page);
    article.innerHTML = `<p>Logical content ${page}</p>`;
    pages.append(article);
  }
  root.append(pages);
  return root;
}

describe("print imposition", () => {
  it.each([
    { pages: 4, mode: "one-up" as const, sheets: 4 },
    { pages: 3, mode: "one-up" as const, sheets: 3 },
    { pages: 4, mode: "two-up" as const, sheets: 2 },
    { pages: 3, mode: "two-up" as const, sheets: 2 },
    { pages: 1, mode: "two-up" as const, sheets: 1 },
  ])("maps $pages logical pages to $sheets $mode sheets", (scenario) => {
    expect(getPhysicalSheetCount(scenario.pages, scenario.mode)).toBe(
      scenario.sheets,
    );
  });

  it("keeps one logical page unchanged on every one-up sheet", () => {
    const result = createPrintImposition({
      document,
      printRoot: createPrintRoot(4),
      mode: "one-up",
      documentLanguage: "fr",
    });

    expect(result.physicalSheetCount).toBe(4);
    expect(result.scale).toBe(1);
    expect(result.element.querySelectorAll(".print-sheet")).toHaveLength(4);
    expect(
      [
        ...result.element.querySelectorAll<HTMLElement>(".print-logical-page"),
      ].map((page) => page.textContent),
    ).toEqual([
      "Logical content 1",
      "Logical content 2",
      "Logical content 3",
      "Logical content 4",
    ]);
  });

  it("places LTR pages from left to right without changing logical order", () => {
    const root = createPrintRoot(4);
    const result = createPrintImposition({
      document,
      printRoot: root,
      mode: "two-up",
      documentLanguage: "fr",
    });
    const firstSheetSlots = result.element
      .querySelector(".print-sheet")!
      .querySelectorAll<HTMLElement>(".print-slot");

    expect(firstSheetSlots[0]).toHaveAttribute(
      "data-physical-position",
      "left",
    );
    expect(firstSheetSlots[0]).toHaveAttribute("data-logical-page-number", "1");
    expect(firstSheetSlots[1]).toHaveAttribute(
      "data-physical-position",
      "right",
    );
    expect(firstSheetSlots[1]).toHaveAttribute("data-logical-page-number", "2");
    expect(
      [...root.querySelectorAll<HTMLElement>("[data-page-number]")].map(
        (page) => page.dataset.pageNumber,
      ),
    ).toEqual(["1", "2", "3", "4"]);
  });

  it("places Arabic pages from right to left and leaves the odd slot empty", () => {
    const result = createPrintImposition({
      document,
      printRoot: createPrintRoot(3),
      mode: "two-up",
      documentLanguage: "ar",
    });
    const sheets = result.element.querySelectorAll<HTMLElement>(".print-sheet");
    const firstSlots = sheets[0]!.querySelectorAll<HTMLElement>(".print-slot");
    const lastSlots = sheets[1]!.querySelectorAll<HTMLElement>(".print-slot");

    expect(result.physicalSheetCount).toBe(2);
    expect(firstSlots[0]).toHaveAttribute("data-physical-position", "right");
    expect(firstSlots[0]).toHaveAttribute("data-logical-page-number", "1");
    expect(firstSlots[1]).toHaveAttribute("data-physical-position", "left");
    expect(firstSlots[1]).toHaveAttribute("data-logical-page-number", "2");
    expect(lastSlots[0]).toHaveAttribute("data-physical-position", "right");
    expect(lastSlots[0]).toHaveAttribute("data-logical-page-number", "3");
    expect(lastSlots[1]).toHaveClass("print-slot--empty");
    expect(lastSlots[1]).not.toHaveAttribute("data-logical-page-number");
  });

  it("calculates a proportional scale from the physical landscape sheet", () => {
    const scale = calculateTwoUpScale();
    const result = createPrintImposition({
      document,
      printRoot: createPrintRoot(1),
      mode: "two-up",
      documentLanguage: "fr",
    });
    const frame =
      result.element.querySelector<HTMLElement>(".print-page-frame")!;
    const width = Number.parseFloat(frame.style.width);
    const height = Number.parseFloat(frame.style.height);

    expect(scale).toBeCloseTo(0.685714, 5);
    expect(width / height).toBeCloseTo(210 / 297, 5);
    expect(frame.style.getPropertyValue("--print-page-scale")).toBe(
      String(scale),
    );
  });

  it("installs and removes the matching physical page orientation", () => {
    const remove = installPrintPageStyle(document, "two-up");
    const style = document.head.querySelector<HTMLStyleElement>(
      '[data-print-page-style="two-up"]',
    );

    expect(style).toHaveTextContent("size: A4 landscape");
    remove();
    expect(document.head).not.toContainElement(style);
  });
});
