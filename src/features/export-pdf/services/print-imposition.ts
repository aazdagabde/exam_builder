import type { DocumentLanguage } from "@/domain/exam";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
} from "@/features/exam-renderer/pagination/pagination.constants";

export type PrintLayoutMode = "one-up" | "two-up";

export const TWO_UP_SHEET_WIDTH_MM = A4_HEIGHT_MM;
export const TWO_UP_SHEET_HEIGHT_MM = A4_WIDTH_MM;
export const TWO_UP_OUTER_MARGIN_MM = 3;
export const TWO_UP_GUTTER_MM = 3;

export interface PrintImpositionResult {
  element: HTMLElement;
  logicalPageCount: number;
  physicalSheetCount: number;
  scale: number;
}

export function getPhysicalSheetCount(
  logicalPageCount: number,
  mode: PrintLayoutMode,
): number {
  if (!Number.isInteger(logicalPageCount) || logicalPageCount < 0) {
    throw new RangeError("logicalPageCount must be a positive integer or zero");
  }
  return mode === "two-up" ? Math.ceil(logicalPageCount / 2) : logicalPageCount;
}

export function calculateTwoUpScale(): number {
  const availableWidth =
    (TWO_UP_SHEET_WIDTH_MM - TWO_UP_OUTER_MARGIN_MM * 2 - TWO_UP_GUTTER_MM) / 2;
  const availableHeight = TWO_UP_SHEET_HEIGHT_MM - TWO_UP_OUTER_MARGIN_MM * 2;

  return Math.min(availableWidth / A4_WIDTH_MM, availableHeight / A4_HEIGHT_MM);
}

function createSlot(
  document: Document,
  page: HTMLElement | undefined,
  logicalPageNumber: number,
  scale: number,
  position: "left" | "right" | "center",
): HTMLElement {
  const slot = document.createElement("div");
  slot.className = "print-slot";
  slot.dataset.physicalPosition = position;

  if (!page) {
    slot.classList.add("print-slot--empty");
    slot.setAttribute("aria-hidden", "true");
    return slot;
  }

  slot.dataset.logicalPageNumber = String(logicalPageNumber);
  const frame = document.createElement("div");
  frame.className = "print-page-frame";
  frame.style.width = `${A4_WIDTH_MM * scale}mm`;
  frame.style.height = `${A4_HEIGHT_MM * scale}mm`;
  frame.style.setProperty("--print-page-scale", String(scale));

  const clone = page.cloneNode(true) as HTMLElement;
  clone.classList.add("print-logical-page");
  clone.dataset.logicalPageNumber = String(logicalPageNumber);
  clone.setAttribute("aria-hidden", "true");
  frame.append(clone);
  slot.append(frame);
  return slot;
}

function physicalPosition(
  language: DocumentLanguage,
  indexInSheet: number,
  mode: PrintLayoutMode,
): "left" | "right" | "center" {
  if (mode === "one-up") return "center";
  if (language === "ar") return indexInSheet === 0 ? "right" : "left";
  return indexInSheet === 0 ? "left" : "right";
}

export function createPrintImposition({
  document,
  printRoot,
  mode,
  documentLanguage,
}: {
  document: Document;
  printRoot: HTMLElement;
  mode: PrintLayoutMode;
  documentLanguage: DocumentLanguage;
}): PrintImpositionResult {
  const logicalPages = [
    ...printRoot.querySelectorAll<HTMLElement>(
      ".exam-pages .exam-page[data-page-number]",
    ),
  ];
  if (logicalPages.length === 0) {
    throw new Error("No logical pages are available for print imposition");
  }

  const pagesPerSheet = mode === "two-up" ? 2 : 1;
  const scale = mode === "two-up" ? calculateTwoUpScale() : 1;
  const physicalSheetCount = getPhysicalSheetCount(logicalPages.length, mode);
  const element = document.createElement("div");
  element.className = `print-layout print-layout--${mode}`;
  element.dataset.printImposition = mode;
  element.dataset.logicalPageCount = String(logicalPages.length);
  element.dataset.physicalSheetCount = String(physicalSheetCount);
  element.dataset.documentDirection = documentLanguage === "ar" ? "rtl" : "ltr";
  element.setAttribute("aria-hidden", "true");

  for (let sheetIndex = 0; sheetIndex < physicalSheetCount; sheetIndex += 1) {
    const sheet = document.createElement("section");
    sheet.className = `print-sheet print-sheet--${documentLanguage === "ar" ? "rtl" : "ltr"}`;
    sheet.dataset.physicalSheetNumber = String(sheetIndex + 1);

    for (let slotIndex = 0; slotIndex < pagesPerSheet; slotIndex += 1) {
      const logicalIndex = sheetIndex * pagesPerSheet + slotIndex;
      sheet.append(
        createSlot(
          document,
          logicalPages[logicalIndex],
          logicalIndex + 1,
          scale,
          physicalPosition(documentLanguage, slotIndex, mode),
        ),
      );
    }
    element.append(sheet);
  }

  return {
    element,
    logicalPageCount: logicalPages.length,
    physicalSheetCount,
    scale,
  };
}

export function installPrintPageStyle(
  document: Document,
  mode: PrintLayoutMode,
): () => void {
  const style = document.createElement("style");
  style.dataset.printPageStyle = mode;
  style.textContent = `@media print { @page { size: A4 ${mode === "two-up" ? "landscape" : "portrait"}; margin: 0; } }`;
  document.head.append(style);
  return () => style.remove();
}
