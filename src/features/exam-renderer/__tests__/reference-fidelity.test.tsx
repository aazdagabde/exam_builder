import { render, screen } from "@testing-library/react";

import { ExamSchema, type TableBlock } from "@/domain/exam";
import { ExamHeader } from "@/features/exam-renderer/components/ExamHeader";
import { ExamRenderer } from "@/features/exam-renderer/components/ExamRenderer";
import { calculateTableColumnPercentages } from "@/features/exam-renderer/components/blocks/table-layout";
import { getDocumentLabels } from "@/features/exam-renderer/document-labels";
import {
  createFirstYearReferenceExam,
  createThirdYearReferenceExam,
} from "@/features/exam-renderer/fixtures/real-reference-exam.fixtures";

describe("real-reference renderer decisions", () => {
  it.each([
    ["first year", createFirstYearReferenceExam],
    ["third year", createThirdYearReferenceExam],
  ])("keeps the reconstructed %s fixture structurally valid", (_, factory) => {
    expect(ExamSchema.safeParse(factory()).success).toBe(true);
  });

  it("renders the common institutional header with logo and three zones", () => {
    const exam = createThirdYearReferenceExam();
    const { container } = render(
      <ExamHeader exam={exam} labels={getDocumentLabels("ar")} />,
    );
    expect(container.querySelector(".exam-header-logo")).toBeInTheDocument();
    expect(container.querySelectorAll(".exam-header-panel")).toHaveLength(3);
    expect(container.querySelector(".exam-header-duration")).toHaveTextContent(
      "55",
    );
    expect(screen.getByText(exam.metadata.title)).toBeVisible();
    expect(screen.queryByText("№ 2")).not.toBeInTheDocument();
  });

  it("renders the printable page frame around the measured content", () => {
    const exam = createFirstYearReferenceExam();
    exam.sections = [];
    const { container } = render(<ExamRenderer exam={exam} />);
    const page = container.querySelector(".exam-pages .exam-page");
    expect(
      page?.querySelector(":scope > .exam-page__frame"),
    ).toBeInTheDocument();
    expect(
      page?.querySelector(
        ":scope > .exam-page__frame > .exam-page__content[data-page-capacity]",
      ),
    ).toBeInTheDocument();
  });

  it("allocates more width to text-heavy table columns deterministically", () => {
    const block: TableBlock = {
      id: "weighted-table",
      type: "table",
      startsNewQuestion: true,
      order: 0,
      showHeader: true,
      columns: [
        { id: "year", label: "السنة" },
        { id: "description", label: "المعطيات التاريخية والجغرافية" },
      ],
      rows: [
        {
          id: "row",
          cells: [
            { columnId: "year", value: "1956" },
            {
              columnId: "description",
              value: "وصف طويل يحتاج إلى مساحة أكبر داخل الجدول",
            },
          ],
        },
      ],
    };
    const first = calculateTableColumnPercentages(block);
    expect(first).toEqual(calculateTableColumnPercentages(block));
    expect(first.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100);
    expect(first[1]).toBeGreaterThan(first[0]!);
  });
});
