import JSZip from "jszip";
import { Packer } from "docx";

import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { createExamDocx } from "@/features/export-docx/services/create-exam-docx";

const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

describe("createExamDocx", () => {
  it("embeds resolved assets in the DOCX media archive", async () => {
    const exam = createTestExam([
      createTestSection([allBlockExamples[2]], { id: "images" }),
    ]);
    const created = await createExamDocx({
      exam,
      assetResolver: {
        findById: vi.fn().mockResolvedValue({
          id: "resource-1",
          kind: "image",
          blob: new Blob([PNG], { type: "image/png" }),
          mimeType: "image/png",
          size: PNG.byteLength,
          createdAt: "2026-08-23T00:00:00.000Z",
        }),
      },
    });
    const zip = await JSZip.loadAsync(await Packer.toBuffer(created.document));

    expect(created.unavailableImageCount).toBe(0);
    expect(
      Object.keys(zip.files).some((path) => path.startsWith("word/media/")),
    ).toBe(true);
  });

  it("uses an editable localized placeholder when an image is missing", async () => {
    const exam = createTestExam([
      createTestSection([allBlockExamples[2]], { id: "images" }),
    ]);
    exam.settings.documentLanguage = "ar";
    const created = await createExamDocx({
      exam,
      assetResolver: { findById: vi.fn().mockResolvedValue(null) },
    });
    const zip = await JSZip.loadAsync(await Packer.toBuffer(created.document));
    const xml = await zip.file("word/document.xml")!.async("string");

    expect(created.unavailableImageCount).toBe(1);
    expect(created.imageWarnings).toContainEqual({
      code: "IMAGE_MISSING",
      imageId: "resource-1",
    });
    expect(xml).toContain("الصورة غير متوفرة");
  });

  it("converts WEBP through the injected per-image normalizer", async () => {
    const normalize = vi.fn().mockResolvedValue({
      type: "png",
      data: PNG,
      widthPx: 1,
      heightPx: 1,
    });
    const exam = createTestExam([
      createTestSection([allBlockExamples[2]], { id: "images" }),
    ]);
    await createExamDocx({
      exam,
      assetResolver: {
        findById: vi.fn().mockResolvedValue({
          id: "resource-1",
          kind: "image",
          blob: new Blob([Uint8Array.of(1)], { type: "image/webp" }),
          mimeType: "image/webp",
          size: 1,
          createdAt: "2026-08-23T00:00:00.000Z",
        }),
      },
      imageNormalizer: { normalize },
    });

    expect(normalize).toHaveBeenCalledOnce();
  });

  it("blocks structurally invalid Exams but keeps business warnings non-blocking", async () => {
    const warningExam = createTestExam();
    warningExam.metadata.totalPoints = 19;
    const created = await createExamDocx({
      exam: warningExam,
      assetResolver: { findById: vi.fn() },
    });
    expect(created.warnings.length).toBeGreaterThan(0);

    const invalid = { ...warningExam, schemaVersion: 99 };
    await expect(
      createExamDocx({
        exam: invalid as never,
        assetResolver: { findById: vi.fn() },
      }),
    ).rejects.toMatchObject({ code: "INVALID_EXAM" });
  });
});
