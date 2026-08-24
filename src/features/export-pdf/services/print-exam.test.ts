import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import {
  getExamPrintFileName,
  prepareExamForPrint,
  printPreparedExam,
  waitForPrintableImages,
  waitForRendererReady,
} from "@/features/export-pdf/services/print-exam";

describe("print exam service", () => {
  it("preserves Arabic while removing only unsafe filename characters", () => {
    const exam = createTestExam([], {
      title: 'فرض محروس: رقم 2 / "التاريخ"',
    });
    exam.metadata.level = "الثالثة إعدادي";

    expect(getExamPrintFileName(exam)).toBe(
      "فرض محروس رقم 2 التاريخ - الثالثة إعدادي",
    );
  });

  it("falls back to a neutral filename", () => {
    const exam = createTestExam([], { title: "<>:*?" });
    exam.metadata.level = "";
    expect(getExamPrintFileName(exam)).toBe("exam");
  });

  it("waits for save, fonts, the current renderer revision, and images", async () => {
    const events: string[] = [];
    const exam = createTestExam([createTestSection()]);
    const root = document.createElement("div");
    root.dataset.printPageCount = "3";
    root.innerHTML = [
      '<div data-image-status="missing" data-image-id="map"></div>',
      '<div data-image-status="missing" data-image-id="map"></div>',
    ].join("");

    const result = await prepareExamForPrint({
      document,
      getSnapshot: () => ({ exam, revision: 7 }),
      ensureSaved: async () => {
        events.push("save");
      },
      dependencies: {
        waitForFonts: async () => {
          events.push("fonts");
        },
        waitForRenderer: async (_document, revision) => {
          events.push(`renderer:${revision}`);
          return root;
        },
        waitForImages: async () => {
          events.push("images");
        },
      },
    });

    expect(events).toEqual([
      "save",
      "fonts",
      "renderer:7",
      "images",
      "renderer:7",
    ]);
    expect(result).toMatchObject({
      exam,
      revision: 7,
      pageCount: 3,
      unavailableImageCount: 1,
    });
  });

  it("restarts preparation when the Exam changes during readiness", async () => {
    const exam = createTestExam([createTestSection()]);
    const root = document.createElement("div");
    let revision = 1;
    const renderedRevisions: number[] = [];

    const result = await prepareExamForPrint({
      document,
      getSnapshot: () => ({ exam, revision }),
      ensureSaved: async () => undefined,
      dependencies: {
        waitForFonts: async () => undefined,
        waitForRenderer: async (_document, requestedRevision) => {
          renderedRevisions.push(requestedRevision);
          return root;
        },
        waitForImages: async () => {
          if (revision === 1) revision = 2;
        },
      },
    });

    expect(renderedRevisions).toEqual([1, 1, 2, 2]);
    expect(result.revision).toBe(2);
  });

  it("blocks a structurally invalid Exam", async () => {
    const exam = createTestExam([createTestSection()]);
    exam.metadata.title = "";

    await expect(
      prepareExamForPrint({
        document,
        getSnapshot: () => ({ exam, revision: 0 }),
        ensureSaved: async () => undefined,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_EXAM",
    });
  });

  it("observes the Renderer until the requested revision is ready", async () => {
    const root = document.createElement("div");
    root.dataset.printRoot = "";
    root.dataset.renderedRevision = "2";
    root.dataset.printReady = "false";
    document.body.append(root);

    const pending = waitForRendererReady(document, 2, 100);
    root.dataset.printReady = "true";

    await expect(pending).resolves.toBe(root);
    root.remove();
  });

  it("decodes every printable image before continuing", async () => {
    const root = document.createElement("div");
    const image = document.createElement("img");
    const decode = vi.fn().mockResolvedValue(undefined);
    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 320 },
      decode: { configurable: true, value: decode },
    });
    root.append(image);

    await waitForPrintableImages(root);

    expect(decode).toHaveBeenCalledOnce();
  });

  it("restores document.title after printing and after a print failure", async () => {
    const exam = createTestExam([], { title: "Contrôle 2" });
    const originalTitle = "Exam Builder";
    const root = document.createElement("div");
    root.innerHTML =
      '<div class="exam-pages"><article class="exam-page" data-page-number="1">Question</article></div>';
    document.title = originalTitle;
    const frame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);

    await printPreparedExam({
      document,
      window,
      exam,
      root,
      layoutMode: "one-up",
    });
    expect(print).toHaveBeenCalledOnce();
    expect(root.querySelector("[data-print-imposition]")).toBeNull();
    expect(document.head.querySelector("[data-print-page-style]")).toBeNull();
    expect(document.title).toBe(originalTitle);
    expect(document.documentElement).not.toHaveAttribute("data-printing");

    print.mockImplementation(() => {
      throw new Error("Print failed");
    });
    await expect(
      printPreparedExam({
        document,
        window,
        exam,
        root,
        layoutMode: "two-up",
      }),
    ).rejects.toMatchObject({
      code: "PRINT_FAILED",
    });
    expect(document.title).toBe(originalTitle);
    expect(document.documentElement).not.toHaveAttribute("data-printing");
    expect(document.documentElement).not.toHaveAttribute("data-print-layout");

    frame.mockRestore();
    print.mockRestore();
  });
});
