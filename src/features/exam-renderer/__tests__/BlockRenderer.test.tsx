import { fireEvent, render, screen } from "@testing-library/react";

import type { ExamBlock } from "@/domain/exam";
import { BlockRenderer } from "@/features/exam-renderer/components/BlockRenderer";
import { getDocumentLabels } from "@/features/exam-renderer/document-labels";
import { rendererBlocks } from "@/features/exam-renderer/__tests__/renderer.fixtures";

function renderBlock(block: ExamBlock, language: "ar" | "fr" = "ar") {
  return render(
    <BlockRenderer
      block={block}
      labels={getDocumentLabels(language)}
      assets={
        new Map([
          [
            "image-asset",
            { status: "ready", objectUrl: "blob:renderer-image" },
          ],
        ])
      }
    />,
  );
}

describe("BlockRenderer", () => {
  it("routes all 16 domain block types", () => {
    for (const block of rendererBlocks) {
      const view = renderBlock(block);
      expect(view.container).toBeInTheDocument();
      view.unmount();
    }
  });

  it.each([1, 3, 5])("renders exactly %i requested answer lines", (count) => {
    const question = rendererBlocks.find((block) => block.type === "question")!;
    if (question.type !== "question") throw new Error("fixture mismatch");
    renderBlock({ ...question, answerLines: count });
    expect(
      screen.getByTestId("answer-lines").querySelectorAll(".exam-answer-line"),
    ).toHaveLength(count);
  });

  it("renders a response box and no response area for none", () => {
    const question = rendererBlocks.find((block) => block.type === "question")!;
    if (question.type !== "question") throw new Error("fixture mismatch");
    const box = renderBlock({ ...question, answerMode: "box", answerLines: 5 });
    expect(box.container.querySelector(".exam-answer-box")).toHaveStyle({
      minHeight: "8.5em",
    });
    box.unmount();
    renderBlock({ ...question, answerMode: "none", answerLines: undefined });
    expect(screen.queryByTestId("answer-lines")).not.toBeInTheDocument();
    expect(document.querySelector(".exam-answer-box")).not.toBeInTheDocument();
  });

  it("uses document labels for true/false and never renders a correction", () => {
    renderBlock(rendererBlocks.find((block) => block.type === "true-false")!);
    expect(screen.getByText("صحيح")).toBeVisible();
    expect(screen.getByText("خطأ")).toBeVisible();
    expect(document.querySelectorAll("input")).toHaveLength(0);
  });

  it("renders fill blanks, semantic tables, and matching columns without arrows", () => {
    const fill = renderBlock(
      rendererBlocks.find((block) => block.type === "fill-blank")!,
    );
    expect(fill.container.querySelector(".exam-blank")).toBeInTheDocument();
    fill.unmount();
    const table = renderBlock(
      rendererBlocks.find((block) => block.type === "table")!,
    );
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getByText("الاستقلال")).toBeVisible();
    table.unmount();
    const matching = renderBlock(
      rendererBlocks.find((block) => block.type === "matching")!,
    );
    expect(
      matching.container.querySelectorAll(".exam-matching-row"),
    ).toHaveLength(1);
    expect(matching.container.textContent).not.toMatch(/[→←➜]/);
  });

  it("keeps long and empty table cells in the semantic table", () => {
    const table = rendererBlocks.find((block) => block.type === "table")!;
    if (table.type !== "table") throw new Error("fixture mismatch");
    const longValue =
      "Observation géographique détaillée avec une source-longue-sans-espace.example/2026/indicateur";
    renderBlock(
      {
        ...table,
        columns: [
          {
            id: "long",
            label: "Colonne avec un intitulé particulièrement long",
          },
          { id: "empty", label: "Réponse" },
        ],
        rows: [
          {
            id: "long-row",
            cells: [
              { columnId: "long", value: longValue },
              { columnId: "empty", value: "" },
            ],
          },
        ],
      },
      "fr",
    );
    expect(screen.getByText(longValue)).toBeVisible();
    expect(screen.getAllByRole("cell")).toHaveLength(2);
    expect(screen.getAllByRole("cell")[1]).toHaveTextContent("");
    expect(
      document.querySelector(".exam-table-row--answer"),
    ).toBeInTheDocument();
  });

  it("renders table points only on the final paginated fragment", () => {
    const table = rendererBlocks.find((block) => block.type === "table")!;
    if (table.type !== "table") throw new Error("fixture mismatch");
    const hidden = render(
      <BlockRenderer
        block={table}
        fragment={{
          kind: "table",
          rows: table.rows,
          showPoints: false,
          showQuestionNumber: true,
        }}
        labels={getDocumentLabels("fr")}
        assets={new Map()}
      />,
    );
    expect(hidden.container.querySelector(".exam-points")).toBeNull();
    hidden.unmount();
    render(
      <BlockRenderer
        block={table}
        fragment={{
          kind: "table",
          rows: table.rows,
          showPoints: true,
          showQuestionNumber: true,
        }}
        labels={getDocumentLabels("fr")}
        assets={new Map()}
      />,
    );
    expect(document.querySelectorAll(".exam-points")).toHaveLength(1);
  });

  it("renders a resolved image and a graceful missing state", () => {
    const image = rendererBlocks.find((block) => block.type === "image")!;
    const ready = renderBlock(image);
    expect(screen.getByRole("img", { name: "وثيقة 1" })).toHaveAttribute(
      "src",
      "blob:renderer-image",
    );
    ready.unmount();
    render(
      <BlockRenderer
        block={image}
        labels={getDocumentLabels("fr")}
        assets={new Map()}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Image indisponible" }),
    ).toBeVisible();
  });

  it("signals image loading so measured pagination can run again", () => {
    const image = rendererBlocks.find((block) => block.type === "image")!;
    const onContentLoad = vi.fn();
    render(
      <BlockRenderer
        block={image}
        labels={getDocumentLabels("ar")}
        assets={
          new Map([
            [
              "image-asset",
              { status: "ready", objectUrl: "blob:renderer-image" },
            ],
          ])
        }
        onContentLoad={onContentLoad}
      />,
    );
    fireEvent.load(screen.getByRole("img", { name: "وثيقة 1" }));
    expect(onContentLoad).toHaveBeenCalledOnce();
  });

  it("clamps image width to the printable area and preserves containment styles", () => {
    const image = rendererBlocks.find((block) => block.type === "image")!;
    if (image.type !== "image") throw new Error("fixture mismatch");
    const view = renderBlock({ ...image, width: 140 });
    expect(view.container.querySelector("figure")).toHaveStyle({
      width: "100%",
    });
    expect(screen.getByRole("img", { name: "وثيقة 1" })).toHaveClass(
      "exam-image-content",
    );
  });

  it("renders an essay like a school prompt without editor-style labels", () => {
    const essay = rendererBlocks.find((block) => block.type === "essay")!;
    renderBlock(essay);
    expect(screen.getByText("شهد المغرب تحولات مهمة.")).toBeVisible();
    expect(screen.queryByText("السياق")).not.toBeInTheDocument();
    expect(screen.queryByText("العناصر")).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeVisible();
  });

  it.each(["horizontal", "vertical"] as const)(
    "renders a %s timeline while preserving Domain event order",
    (orientation) => {
      const timeline = rendererBlocks.find(
        (block) => block.type === "timeline",
      )!;
      if (timeline.type !== "timeline") throw new Error("fixture mismatch");
      const view = renderBlock({
        ...timeline,
        orientation,
        timelineStyle: "simple",
        spacingMode: "sequence",
        scale: null,
      });
      const events = view.container.querySelectorAll(".exam-timeline__event");
      expect(events).toHaveLength(2);
      expect(events[0]).toHaveTextContent("1912");
      expect(events[1]).toHaveTextContent("1956");
      expect(
        view.container.querySelector(
          `[data-timeline-orientation="${orientation}"]`,
        ),
      ).toBeInTheDocument();
    },
  );

  it("renders an Arabic historical Timeline LTR independently from text direction", () => {
    const timeline = rendererBlocks.find((block) => block.type === "timeline")!;
    if (timeline.type !== "timeline") throw new Error("fixture mismatch");
    const view = renderBlock(timeline, "ar");
    const svg = view.container.querySelector(".exam-timeline__svg")!;
    const axis = svg.querySelector(".exam-timeline__axis")!;
    expect(svg).toHaveAttribute("data-chronology-direction", "ltr");
    expect(Number(axis.getAttribute("x1"))).toBeLessThan(
      Number(axis.getAttribute("x2")),
    );
    expect(svg.querySelectorAll(".exam-timeline__tick")).toHaveLength(12);
    expect(svg.querySelectorAll(".exam-timeline__period")).toHaveLength(3);
    expect(svg.textContent).toContain("الحماية");
  });

  it("mirrors an Arabic historical Timeline when chronology is explicitly RTL", () => {
    const timeline = rendererBlocks.find((block) => block.type === "timeline")!;
    if (timeline.type !== "timeline") throw new Error("fixture mismatch");
    const view = renderBlock({ ...timeline, chronologyDirection: "rtl" }, "ar");
    const svg = view.container.querySelector(".exam-timeline__svg")!;
    const axis = svg.querySelector(".exam-timeline__axis")!;
    expect(svg).toHaveAttribute("data-chronology-direction", "rtl");
    expect(Number(axis.getAttribute("x1"))).toBeGreaterThan(
      Number(axis.getAttribute("x2")),
    );
  });

  it("keeps French text LTR while supporting either chronology direction", () => {
    const timeline = rendererBlocks.find((block) => block.type === "timeline")!;
    if (timeline.type !== "timeline") throw new Error("fixture mismatch");
    const french = {
      ...timeline,
      title: "Repères historiques",
      chronologyDirection: "rtl" as const,
      events: timeline.events.map((event) => ({
        ...event,
        label: event.axisValue === 1912 ? "Protectorat" : "Indépendance",
      })),
    };
    const view = renderBlock(french, "fr");
    expect(view.container.querySelector(".exam-timeline__svg")).toHaveAttribute(
      "data-chronology-direction",
      "rtl",
    );
    expect(view.container).toHaveTextContent("Indépendance");
  });

  it("renders a practical 20-event, 20-tick, 4-period fixture without rasterization", () => {
    const source = rendererBlocks.find((block) => block.type === "timeline")!;
    if (source.type !== "timeline") throw new Error("fixture mismatch");
    const view = renderBlock({
      ...source,
      scale: { start: 0, end: 19, step: 1, unitLabel: "" },
      events: Array.from({ length: 20 }, (_, axisValue) => ({
        id: `event-${axisValue}`,
        date: String(axisValue),
        axisValue,
        label: `E${axisValue}`,
        description: "",
      })),
      periods: Array.from({ length: 4 }, (_, index) => ({
        id: `period-${index}`,
        startValue: index * 4,
        endValue: index * 4 + 3,
        label: `P${index}`,
      })),
    });

    expect(view.container.querySelectorAll("canvas")).toHaveLength(0);
    expect(
      view.container.querySelectorAll(".exam-timeline__tick"),
    ).toHaveLength(20);
    expect(
      view.container.querySelectorAll(".exam-timeline__historical-event"),
    ).toHaveLength(20);
    expect(
      view.container.querySelectorAll(".exam-timeline__period"),
    ).toHaveLength(4);
  });

  it.each(["bar", "line", "pie"] as const)(
    "renders a vector %s chart with labels",
    (chartType) => {
      const chart = rendererBlocks.find((block) => block.type === "chart")!;
      if (chart.type !== "chart") throw new Error("fixture mismatch");
      const view = renderBlock({ ...chart, chartType });
      expect(view.container.querySelector("svg")).toBeInTheDocument();
      expect(view.container.querySelector("svg")?.outerHTML).toContain("1960");
      expect(screen.getByRole("img", { name: "السكان" })).toBeVisible();
    },
  );

  it("renders a clear pie fallback without changing negative data", () => {
    const chart = rendererBlocks.find((block) => block.type === "chart")!;
    if (chart.type !== "chart") throw new Error("fixture mismatch");
    const negative = {
      ...chart,
      chartType: "pie" as const,
      series: [{ ...chart.series[0]!, values: [12, -2] }],
    };
    renderBlock(negative, "fr");
    expect(
      screen.getByText(
        "Les données ne sont pas compatibles avec ce graphique.",
      ),
    ).toBeVisible();
    expect(negative.series[0]!.values).toEqual([12, -2]);
  });
});
