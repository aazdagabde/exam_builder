import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Packer } from "docx";

import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import {
  createFirstYearReferenceExam,
  createThirdYearReferenceExam,
} from "@/features/exam-renderer/fixtures/real-reference-exam.fixtures";
import { createExamDocument } from "@/features/export-docx/renderer/create-exam-document";
import { readPngDimensions } from "@/features/export-docx/services/docx-images";

const QA_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

function genericFrenchExam() {
  const exam = createTestExam([
    createTestSection(allBlockExamples, {
      id: "all-blocks",
      title: "Histoire, géographie et citoyenneté",
      points: 20,
    }),
  ]);
  exam.metadata = {
    title: "Devoir surveillé n° 1",
    academicYear: "2025/2026",
    regionalAcademy: "Académie régionale de l’éducation et de la formation",
    provincialDirectorate: "Direction provinciale",
    institution: "Collège public de démonstration",
    level: "Troisième année collège",
    subject: "Histoire-Géographie",
    teacherName: "Mme Enseignante",
    durationMinutes: 55,
    totalPoints: 20,
    examNumber: "1",
  };
  exam.settings.documentLanguage = "fr";
  return exam;
}

function thirdYearDocxReference() {
  const exam = createThirdYearReferenceExam();
  return {
    ...exam,
    sections: exam.sections.map((section) => ({
      ...section,
      // The real paired PDF flows directly; Phase 11's synthetic pagination
      // break remains covered by the dedicated renderer tests instead.
      blocks: section.blocks.filter((block) => block.type !== "page-break"),
    })),
  };
}

describe("DOCX reference QA fixtures", () => {
  it("packs two Arabic references and one French all-block document", async () => {
    const qaLogoPath = process.env.DOCX_QA_LOGO;
    const logoData = qaLogoPath
      ? new Uint8Array(await readFile(qaLogoPath))
      : QA_PNG;
    const logoDimensions = readPngDimensions(logoData);
    const logo = {
      type: "png" as const,
      data: logoData,
      ...logoDimensions,
    };
    const documents = [
      ["reference-third-year-ar.docx", thirdYearDocxReference()],
      ["reference-first-year-ar.docx", createFirstYearReferenceExam()],
      ["reference-all-blocks-fr.docx", genericFrenchExam()],
    ] as const;
    const outputDirectory = process.env.DOCX_QA_OUTPUT;
    if (outputDirectory) await mkdir(outputDirectory, { recursive: true });

    for (const [fileName, exam] of documents) {
      const images = new Map(
        exam.sections.flatMap((section) =>
          section.blocks.flatMap((block) =>
            block.type === "image"
              ? [
                  [
                    block.imageId,
                    {
                      type: "png" as const,
                      data: logoData,
                      ...logoDimensions,
                    },
                  ] as const,
                ]
              : [],
          ),
        ),
      );
      const buffer = await Packer.toBuffer(
        createExamDocument(exam, { images, institutionalLogo: logo }),
      );
      expect(buffer.subarray(0, 2).toString()).toBe("PK");
      expect(buffer.byteLength).toBeGreaterThan(10_000);
      if (outputDirectory) {
        await writeFile(path.join(outputDirectory, fileName), buffer);
      }
    }
  });
});
