import { createTestExam } from "@/domain/exam/__tests__/exam.fixtures";
import {
  downloadDocxBlob,
  exportExamDocx,
  getExamDocxFileName,
} from "@/features/export-docx/services/export-exam-docx";

describe("DOCX export service", () => {
  it("preserves Arabic and accents in a safe .docx filename", () => {
    const exam = createTestExam();
    exam.metadata.title = 'فرض محروس: تاريخ/جغرافيا "été"';
    exam.metadata.level = "الثالثة إعدادي";

    expect(getExamDocxFileName(exam)).toBe(
      "فرض محروس تاريخ جغرافيا été - الثالثة إعدادي.docx",
    );
  });

  it("falls back to exam.docx", () => {
    const exam = createTestExam();
    exam.metadata.title = "***";
    exam.metadata.level = "";
    expect(getExamDocxFileName(exam)).toBe("exam.docx");
  });

  it("downloads a Blob and always revokes its object URL", () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = { href: "", download: "", hidden: false, click, remove };
    const append = vi.fn();
    const createObjectURL = vi.fn().mockReturnValue("blob:docx");
    const revokeObjectURL = vi.fn();

    downloadDocxBlob(new Blob(["word"]), "devoir.docx", {
      document: {
        createElement: vi.fn().mockReturnValue(anchor),
        body: { append },
      } as unknown as Document,
      url: { createObjectURL, revokeObjectURL },
    });

    expect(anchor.href).toBe("blob:docx");
    expect(anchor.download).toBe("devoir.docx");
    expect(append).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:docx");
  });

  it("packs then downloads, while treating an unavailable logo as non-blocking", async () => {
    const pack = vi.fn().mockResolvedValue(new Blob(["docx"]));
    const download = vi.fn();
    const created = await exportExamDocx({
      exam: createTestExam(),
      assetResolver: { findById: vi.fn() },
      loadLogo: vi.fn().mockRejectedValue(new Error("missing")),
      pack,
      download,
    });

    expect(pack).toHaveBeenCalledOnce();
    expect(download).toHaveBeenCalledOnce();
    expect(created.imageWarnings).toContainEqual({ code: "LOGO_UNAVAILABLE" });
  });
});
