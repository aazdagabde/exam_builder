import JSZip from "jszip";
import { Packer } from "docx";

import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import type { ExamBlock } from "@/domain/exam";
import { getDocumentLabels } from "@/features/exam-renderer/document-labels";
import { renderExamBlock } from "@/features/export-docx/renderer/docx-block-renderer";
import {
  createExamDocument,
  renderExamBody,
} from "@/features/export-docx/renderer/create-exam-document";
import { mmToTwips } from "@/features/export-docx/styles/docx-theme";

async function documentXml(exam = createTestExam()) {
  const buffer = await Packer.toBuffer(createExamDocument(exam));
  const archive = await JSZip.loadAsync(buffer);
  return {
    archive,
    xml: await archive.file("word/document.xml")!.async("string"),
  };
}

describe("DOCX renderer", () => {
  it("uses deterministic A4 Word units", () => {
    expect(mmToTwips(210)).toBe(11906);
    expect(mmToTwips(297)).toBe(16838);
    expect(mmToTwips(17.5)).toBe(992);
  });

  it("routes all 17 discriminated block types", () => {
    const context = { language: "fr" as const };
    const labels = getDocumentLabels("fr");
    const assets = { images: new Map() };
    const renderedTypes = allBlockExamples.map((block) => {
      expect(
        renderExamBlock(block, context, labels, assets).length,
      ).toBeGreaterThan(0);
      return block.type;
    });

    expect(new Set(renderedTypes)).toEqual(
      new Set([
        "instruction",
        "text-document",
        "image",
        "question",
        "definition",
        "true-false",
        "multiple-choice",
        "fill-blank",
        "table",
        "matching",
        "timeline",
        "chart",
        "diagram",
        "essay",
        "free-text",
        "separator",
        "page-break",
      ]),
    );
  });

  it("packs editable Arabic paragraphs and native RTL tables on A4", async () => {
    const exam = createTestExam([
      createTestSection(allBlockExamples, {
        title: "مادة التاريخ",
        points: 20,
      }),
    ]);
    exam.settings.documentLanguage = "ar";
    exam.metadata.title = "فرض محروس رقم 1";
    exam.metadata.level = "الثالثة إعدادي";
    const { archive, xml } = await documentXml(exam);

    expect(xml).toContain('w:w="11906"');
    expect(xml).toContain('w:h="16838"');
    expect(xml).toContain("<w:bidi");
    expect(xml).toContain("<w:bidiVisual");
    expect(xml).toContain("فرض محروس رقم 1");
    expect(xml).toContain("مادة التاريخ");
    expect(xml).toContain("<w:tbl");
    expect(archive.file("word/styles.xml")).not.toBeNull();
  });

  it("keeps advanced Timeline scale, events and periods as editable Word tables", async () => {
    const source = allBlockExamples.find((block) => block.type === "timeline")!;
    if (source.type !== "timeline") throw new Error("fixture mismatch");
    const timeline: ExamBlock = {
      ...source,
      timelineStyle: "historical",
      spacingMode: "scaled",
      chronologyDirection: "ltr",
      scale: { start: 1912, end: 1956, step: 4, unitLabel: "années" },
      scaleCaption: "Chaque graduation représente 4 ans",
      events: source.events.map((event, index) => ({
        ...event,
        axisValue: index === 0 ? 1912 : 1956,
      })),
      periods: [
        {
          id: "period-resistance",
          startValue: 1912,
          endValue: 1934,
          label: "Résistance",
        },
      ],
    };
    const exam = createTestExam([createTestSection([timeline])]);
    exam.settings.documentLanguage = "fr";
    const { xml } = await documentXml(exam);

    expect(xml).toContain("Échelle");
    expect(xml).toContain("1912–1956");
    expect(xml).toContain("Position");
    expect(xml).toContain("Résistance");
    expect(xml).toContain("Chaque graduation représente 4 ans");
    expect(xml.match(/<w:tbl>/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps horizontal, vertical and hierarchy Diagrams editable with all labels", async () => {
    const source = allBlockExamples.find((block) => block.type === "diagram")!;
    if (source.type !== "diagram") throw new Error("fixture mismatch");
    const blocks: ExamBlock[] = [
      {
        ...source,
        id: "diagram-horizontal",
        layout: "horizontal-flow",
        title: "Horizontal",
      },
      {
        ...source,
        id: "diagram-vertical",
        layout: "vertical-flow",
        title: "Vertical",
      },
      {
        ...source,
        id: "diagram-hierarchy",
        layout: "hierarchy",
        title: "Hierarchy",
      },
    ];
    const exam = createTestExam([createTestSection(blocks)]);
    exam.settings.documentLanguage = "fr";

    const { archive, xml } = await documentXml(exam);

    expect(xml).toContain("Horizontal");
    expect(xml).toContain("Vertical");
    expect(xml).toContain("Hierarchy");
    expect(xml).toContain("Production");
    expect(xml).toContain("Transport");
    expect(xml).toContain("Distribution");
    expect(xml).toContain("achemine");
    expect(xml).toContain("Relations");
    expect(archive.file("word/media/image1.png")).toBeNull();
  });

  it("keeps French paragraphs LTR and does not derive direction from UI", async () => {
    document.documentElement.dir = "rtl";
    const exam = createTestExam([
      createTestSection([allBlockExamples[0], allBlockExamples[8]]),
    ]);
    exam.settings.documentLanguage = "fr";
    const { xml } = await documentXml(exam);

    expect(xml).not.toContain("<w:bidi/>");
    expect(xml).not.toContain("<w:bidiVisual/>");
    expect(xml).toContain("Read carefully");
  });

  it("shows a separate exam number only when the title does not contain it", async () => {
    const exam = createTestExam();
    exam.settings.documentLanguage = "fr";
    exam.metadata.title = "Devoir surveillé";
    exam.metadata.examNumber = "2";
    let result = await documentXml(exam);
    expect(result.xml).toContain("№ 2");

    exam.metadata.title = "Devoir surveillé n° 2";
    result = await documentXml(exam);
    expect(result.xml).not.toContain("№ 2");
  });

  it("removes initial, final and consecutive page breaks", async () => {
    const pageBreak = (id: string, order: number) => ({
      id,
      type: "page-break" as const,
      startsNewQuestion: false as const,
      order,
    });
    const exam = createTestExam([
      createTestSection(
        [
          pageBreak("initial-a", 0),
          pageBreak("initial-b", 1),
          { ...allBlockExamples[0], order: 2 },
          pageBreak("middle-a", 3),
          pageBreak("middle-b", 4),
          { ...allBlockExamples[3], order: 5 },
          pageBreak("final", 6),
        ],
        { id: "section-breaks" },
      ),
    ]);
    const { xml } = await documentXml(exam);

    expect(xml.match(/w:type="page"/g)).toHaveLength(1);
  });

  it("keeps a page break before a later section and handles 50+ blocks", async () => {
    const questions: ExamBlock[] = Array.from({ length: 55 }, (_, index) => ({
      id: `question-${index}`,
      type: "question" as const,
      startsNewQuestion: true,
      order: index,
      question: `Question ${index + 1}`,
      answerMode: "none" as const,
    }));
    questions.push({
      id: "break-before-next",
      type: "page-break",
      startsNewQuestion: false,
      order: questions.length,
    });
    const exam = createTestExam([
      createTestSection(questions, { id: "large" }),
      createTestSection([allBlockExamples[0]], { id: "next" }),
    ]);
    const buffer = await Packer.toBuffer(createExamDocument(exam));

    expect(buffer.byteLength).toBeGreaterThan(5_000);
    expect(renderExamBody(exam).length).toBeGreaterThan(55);
  });

  it.each(["ar", "fr"] as const)(
    "uses Domain-derived question numbering in %s Word output",
    async (language) => {
      const question = allBlockExamples.find(
        (block) => block.type === "question",
      );
      const definition = allBlockExamples.find(
        (block) => block.type === "definition",
      );
      if (question?.type !== "question" || definition?.type !== "definition") {
        throw new Error("Expected question and definition fixtures.");
      }
      const exam = createTestExam([
        createTestSection([
          {
            ...question,
            id: "first",
            order: 0,
            startsNewQuestion: true,
          },
          {
            ...question,
            id: "linked",
            order: 1,
            startsNewQuestion: false,
          },
          {
            ...definition,
            id: "second",
            order: 2,
            startsNewQuestion: true,
          },
        ]),
      ]);
      exam.settings.documentLanguage = language;
      exam.settings.questionNumbering = {
        enabled: true,
        restartPerSection: true,
      };
      const { xml } = await documentXml(exam);
      expect(xml).toContain("1-");
      expect(xml).toContain("2-");
      expect(xml).not.toContain("3-");
    },
  );
});
