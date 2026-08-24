import {
  ExamSchema,
  validateExam,
  type Exam,
  type ExamValidationIssue,
} from "@/domain/exam";
import { getSafeExamBaseName } from "@/features/exams/services/exam-export-file-name";
import {
  createPrintImposition,
  installPrintPageStyle,
  type PrintLayoutMode,
} from "@/features/export-pdf/services/print-imposition";

export type PrintPreparationErrorCode =
  | "NO_EXAM"
  | "INVALID_EXAM"
  | "SAVE_FAILED"
  | "RENDERER_TIMEOUT"
  | "IMAGE_FAILED"
  | "PRINT_FAILED";

export class PrintPreparationError extends Error {
  constructor(public readonly code: PrintPreparationErrorCode) {
    super(code);
    this.name = "PrintPreparationError";
  }
}

export interface PrintExamSnapshot {
  exam: Exam | null;
  revision: number;
}

export interface PreparedExamPrint {
  exam: Exam;
  revision: number;
  root: HTMLElement;
  pageCount: number;
  warnings: ExamValidationIssue[];
  unavailableImageCount: number;
}

interface PrintPreparationDependencies {
  waitForFonts(document: Document): Promise<void>;
  waitForRenderer(document: Document, revision: number): Promise<HTMLElement>;
  waitForImages(root: HTMLElement): Promise<void>;
}

export interface PrepareExamForPrintOptions {
  document: Document;
  getSnapshot(): PrintExamSnapshot;
  ensureSaved(): Promise<void>;
  dependencies?: Partial<PrintPreparationDependencies>;
}

const PRINT_ROOT_SELECTOR = "[data-print-root]";
const DEFAULT_READY_TIMEOUT_MS = 10_000;

function printableExam(exam: Exam | null): {
  exam: Exam;
  warnings: ExamValidationIssue[];
} {
  if (exam === null) throw new PrintPreparationError("NO_EXAM");

  const structuralResult = ExamSchema.safeParse(exam);
  if (!structuralResult.success) {
    throw new PrintPreparationError("INVALID_EXAM");
  }

  const issues = validateExam(structuralResult.data);
  if (issues.some((issue) => issue.severity === "error")) {
    throw new PrintPreparationError("INVALID_EXAM");
  }

  return {
    exam: structuralResult.data,
    warnings: issues.filter((issue) => issue.severity === "warning"),
  };
}

export function getExamPrintFileName(exam: Exam): string {
  return getSafeExamBaseName(exam);
}

export function getPrintRoot(
  document: Document,
  revision: number,
): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>(PRINT_ROOT_SELECTOR)].find(
      (root) =>
        root.dataset.renderedRevision === String(revision) &&
        root.dataset.printReady === "true",
    ) ?? null
  );
}

export function waitForRendererReady(
  document: Document,
  revision: number,
  timeoutMs = DEFAULT_READY_TIMEOUT_MS,
): Promise<HTMLElement> {
  const readyRoot = getPrintRoot(document, revision);
  if (readyRoot) return Promise.resolve(readyRoot);

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const root = getPrintRoot(document, revision);
      if (!root) return;
      clearTimeout(timeout);
      observer.disconnect();
      resolve(root);
    });
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new PrintPreparationError("RENDERER_TIMEOUT"));
    }, timeoutMs);

    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: [
        "data-print-ready",
        "data-rendered-revision",
        "data-print-page-count",
      ],
    });
  });
}

export async function waitForDocumentFonts(document: Document): Promise<void> {
  await document.fonts?.ready;
}

async function decodeImage(image: HTMLImageElement): Promise<void> {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener(
        "error",
        () => reject(new PrintPreparationError("IMAGE_FAILED")),
        { once: true },
      );
    });
  }

  if (image.naturalWidth === 0) {
    throw new PrintPreparationError("IMAGE_FAILED");
  }

  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      if (!image.complete || image.naturalWidth === 0) {
        throw new PrintPreparationError("IMAGE_FAILED");
      }
    }
  }
}

export async function waitForPrintableImages(root: HTMLElement): Promise<void> {
  await Promise.all([...root.querySelectorAll("img")].map(decodeImage));
}

export function countUnavailableImages(root: HTMLElement): number {
  return new Set(
    [
      ...root.querySelectorAll<HTMLElement>(
        '[data-image-status="missing"], [data-image-status="error"]',
      ),
    ].map((element) => element.dataset.imageId ?? ""),
  ).size;
}

export async function prepareExamForPrint({
  document,
  getSnapshot,
  ensureSaved,
  dependencies,
}: PrepareExamForPrintOptions): Promise<PreparedExamPrint> {
  const waitForFonts = dependencies?.waitForFonts ?? waitForDocumentFonts;
  const waitForRenderer = dependencies?.waitForRenderer ?? waitForRendererReady;
  const waitForImages = dependencies?.waitForImages ?? waitForPrintableImages;

  for (;;) {
    printableExam(getSnapshot().exam);
    await ensureSaved();

    const snapshot = getSnapshot();
    const validated = printableExam(snapshot.exam);
    await waitForFonts(document);
    let root = await waitForRenderer(document, snapshot.revision);
    await waitForImages(root);
    root = await waitForRenderer(document, snapshot.revision);

    if (getSnapshot().revision !== snapshot.revision) continue;

    return {
      exam: validated.exam,
      revision: snapshot.revision,
      root,
      pageCount: Number(root.dataset.printPageCount) || 1,
      warnings: validated.warnings,
      unavailableImageCount: countUnavailableImages(root),
    };
  }
}

function nextAnimationFrame(window: Window): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export async function printPreparedExam({
  document,
  window,
  exam,
  root,
  layoutMode,
}: {
  document: Document;
  window: Window;
  exam: Exam;
  root: HTMLElement;
  layoutMode: PrintLayoutMode;
}): Promise<void> {
  const previousTitle = document.title;
  let imposition: HTMLElement | null = null;
  let removePageStyle: (() => void) | null = null;
  document.title = getExamPrintFileName(exam);
  document.documentElement.dataset.printing = "true";
  document.documentElement.dataset.printLayout = layoutMode;

  try {
    const result = createPrintImposition({
      document,
      printRoot: root,
      mode: layoutMode,
      documentLanguage: exam.settings.documentLanguage,
    });
    imposition = result.element;
    root.append(imposition);
    removePageStyle = installPrintPageStyle(document, layoutMode);
    await waitForPrintableImages(imposition);
    await nextAnimationFrame(window);
    window.print();
  } catch {
    throw new PrintPreparationError("PRINT_FAILED");
  } finally {
    imposition?.remove();
    removePageStyle?.();
    document.title = previousTitle;
    delete document.documentElement.dataset.printing;
    delete document.documentElement.dataset.printLayout;
  }
}
