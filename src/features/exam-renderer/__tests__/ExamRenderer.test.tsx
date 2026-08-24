import { render, screen, waitFor } from "@testing-library/react";

import { ExamHeader } from "@/features/exam-renderer/components/ExamHeader";
import { ExamRenderer } from "@/features/exam-renderer/components/ExamRenderer";
import { getDocumentLabels } from "@/features/exam-renderer/document-labels";
import { createRendererTestExam } from "@/features/exam-renderer/__tests__/renderer.fixtures";
import { changeInterfaceLanguage } from "@/i18n";

describe("ExamRenderer", () => {
  it("renders exact A4 pages and falls back from an unknown template", () => {
    const exam = createRendererTestExam("fr");
    exam.settings.templateId = "unknown-template";
    const { container } = render(<ExamRenderer exam={exam} />);
    const root = container.querySelector(".exam-renderer");
    expect(root).toHaveAttribute(
      "data-template-id",
      "moroccan-college-classic",
    );
    const visiblePage = container.querySelector(".exam-pages .exam-page");
    expect(visiblePage).toHaveClass("exam-page");
    expect(getComputedStyle(visiblePage!).width).toBe("210mm");
    expect(getComputedStyle(visiblePage!).height).toBe("297mm");
  });

  it("exposes the printable revision only after measured pagination settles", async () => {
    const { container } = render(
      <ExamRenderer exam={createRendererTestExam("fr")} renderRevision={12} />,
    );
    const root = container.querySelector("[data-print-root]");

    expect(root).toHaveAttribute("data-rendered-revision", "12");
    expect(root).toHaveAttribute("data-print-ready", "false");
    await waitFor(() =>
      expect(root).toHaveAttribute("data-print-ready", "true"),
    );
    expect(Number(root?.getAttribute("data-print-page-count"))).toBeGreaterThan(
      0,
    );
  });

  it("derives lang and direction from the exam independently of UI language", async () => {
    await changeInterfaceLanguage("fr");
    const arabic = render(<ExamRenderer exam={createRendererTestExam("ar")} />);
    expect(arabic.container.querySelector(".exam-renderer")).toHaveAttribute(
      "dir",
      "rtl",
    );
    expect(arabic.container.querySelector(".exam-renderer")).toHaveAttribute(
      "lang",
      "ar",
    );
    expect(screen.getAllByText("صحيح").length).toBeGreaterThan(0);
    arabic.unmount();

    await changeInterfaceLanguage("ar");
    const french = render(<ExamRenderer exam={createRendererTestExam("fr")} />);
    expect(french.container.querySelector(".exam-renderer")).toHaveAttribute(
      "dir",
      "ltr",
    );
    expect(screen.getAllByText("Vrai").length).toBeGreaterThan(0);
  });

  it("renders complete metadata and configured paper student fields", () => {
    const exam = createRendererTestExam("fr");
    render(<ExamHeader exam={exam} labels={getDocumentLabels("fr")} />);
    for (const value of [
      "Contrôle continu n° 1",
      "2026-2027",
      "Collège Al Atlas",
      "3e année collège",
      "Histoire-Géographie",
      "Mme Amrani",
      "Nom complet",
      "Numéro",
      "Classe",
      "Note",
    ]) {
      expect(screen.getByText(value, { exact: false })).toBeVisible();
    }
    expect(document.querySelector(".exam-header-duration")).toHaveTextContent(
      "60 min",
    );
    expect(document.querySelectorAll("input, textarea, button")).toHaveLength(
      0,
    );
  });

  it("omits orphan labels for absent optional metadata", () => {
    const exam = createRendererTestExam("fr");
    delete exam.metadata.institution;
    delete exam.metadata.teacherName;
    render(<ExamHeader exam={exam} labels={getDocumentLabels("fr")} />);
    expect(
      screen.queryByText("Établissement:", { exact: false }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Professeur:", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("keeps a minimal header meaningful and accepts a long mixed-language title", () => {
    const exam = createRendererTestExam("fr");
    exam.metadata.title =
      "Évaluation d’Histoire-Géographie — المغرب 1956 — analyse de documents et raisonnement argumenté";
    exam.metadata.level = "";
    exam.metadata.subject = "";
    delete exam.metadata.institution;
    delete exam.metadata.regionalAcademy;
    delete exam.metadata.provincialDirectorate;
    delete exam.metadata.teacherName;
    const { container } = render(
      <ExamHeader exam={exam} labels={getDocumentLabels("fr")} />,
    );
    const title = screen.getByText(exam.metadata.title);
    expect(title).toHaveClass("exam-header-document-title");
    expect(title).toHaveAttribute("dir", "auto");
    expect(
      container.querySelector(".exam-header-administration-fields"),
    ).toBeNull();
    expect(container.querySelector(".exam-header-logo")).toBeInTheDocument();
    expect(screen.getByText("2026-2027")).toBeVisible();
  });

  it("starts content after a PageBreakBlock on the following physical page", () => {
    const exam = createRendererTestExam("fr");
    exam.sections[0]!.blocks = [
      {
        id: "a",
        type: "instruction",
        startsNewQuestion: false,
        order: 0,
        content: "Before break",
      },
      { id: "break", type: "page-break", startsNewQuestion: false, order: 1 },
      {
        id: "b",
        type: "instruction",
        startsNewQuestion: false,
        order: 2,
        content: "After break",
      },
    ];
    const { container } = render(<ExamRenderer exam={exam} />);
    const beforePage = container
      .querySelector('.exam-pages [data-block-id="a"]')
      ?.closest(".exam-page");
    const afterPage = container
      .querySelector('.exam-pages [data-block-id="b"]')
      ?.closest(".exam-page");
    expect(beforePage).toHaveAttribute("data-page-number", "1");
    expect(afterPage).toHaveAttribute("data-page-number", "2");
  });

  it("renders an empty exam as one valid page with its header", () => {
    const exam = createRendererTestExam("fr");
    exam.sections = [];
    const { container } = render(<ExamRenderer exam={exam} />);
    expect(container.querySelectorAll(".exam-pages .exam-page")).toHaveLength(
      1,
    );
    expect(screen.getAllByText("Contrôle continu n° 1").length).toBeGreaterThan(
      0,
    );
  });

  it("produces deterministic pages for the same Exam input", () => {
    const exam = createRendererTestExam("ar");
    const first = render(<ExamRenderer exam={exam} />);
    const firstPages = [...first.container.querySelectorAll(".exam-page")].map(
      (page) => page.textContent,
    );
    first.unmount();
    const second = render(<ExamRenderer exam={exam} />);
    expect(
      [...second.container.querySelectorAll(".exam-page")].map(
        (page) => page.textContent,
      ),
    ).toEqual(firstPages);
  });

  it.each(["ar", "fr"] as const)(
    "renders derived question numbers once per block in %s",
    (language) => {
      const exam = createRendererTestExam(language);
      exam.settings.questionNumbering = {
        enabled: true,
        restartPerSection: true,
      };
      exam.sections[0]!.blocks = exam.sections[0]!.blocks.slice(0, 4).map(
        (block, order) => {
          if (block.type === "separator" || block.type === "page-break") {
            return { ...block, order };
          }
          return {
            ...block,
            order,
            startsNewQuestion:
              block.id === "document" || block.id === "question",
          };
        },
      );
      const { container } = render(<ExamRenderer exam={exam} />);
      const visiblePages = container.querySelector(".exam-pages")!;
      expect(
        visiblePages.querySelector('[data-question-number="1"]'),
      ).toHaveTextContent("1-");
      expect(
        visiblePages.querySelector('[data-question-number="2"]'),
      ).toHaveTextContent("2-");
      expect(
        visiblePages.querySelectorAll("[data-question-number]"),
      ).toHaveLength(2);
    },
  );
});
