import { useEffect, useRef, useState } from "react";

import type { DocumentLanguage } from "@/domain/exam";
import "@/features/exam-renderer/dev/renderer-reference-print.css";
import type { ResolvedImageAssets } from "@/features/exam-renderer/assets/renderer-assets";
import { ExamRenderer } from "@/features/exam-renderer/components/ExamRenderer";
import {
  createRendererReferenceExam,
  REFERENCE_LANDSCAPE_DATA_URL,
} from "@/features/exam-renderer/fixtures/reference-exam.fixtures";
import {
  createFirstYearReferenceExam,
  createThirdYearReferenceExam,
} from "@/features/exam-renderer/fixtures/real-reference-exam.fixtures";
import {
  inspectPageOverflows,
  type PageOverflowReport,
} from "@/features/exam-renderer/pagination/overflow-detector";
import {
  createPrintImposition,
  installPrintPageStyle,
  type PrintLayoutMode,
} from "@/features/export-pdf/services/print-imposition";
import "@/features/export-pdf/styles/print.css";
import { changeInterfaceLanguage } from "@/i18n";

const REFERENCE_ASSETS: ResolvedImageAssets = new Map([
  [
    "reference-landscape",
    { status: "ready", objectUrl: REFERENCE_LANDSCAPE_DATA_URL },
  ],
]);

type ReferenceVariant = "generic" | "third-year" | "first-year";

export function RendererReferencePage() {
  const parameters = new URLSearchParams(window.location.search);
  const requestedReference = parameters.get("reference");
  const initialReference: ReferenceVariant =
    requestedReference === "third-year" || requestedReference === "first-year"
      ? requestedReference
      : "generic";
  const initialLanguage = parameters.get("lang") === "fr" ? "fr" : "ar";
  const interfaceLanguage = parameters.get("ui") === "ar" ? "ar" : "fr";
  const requestedScale = Number(parameters.get("scale"));
  const requestedPrintLayout: PrintLayoutMode | null =
    parameters.get("printLayout") === "two-up"
      ? "two-up"
      : parameters.get("printLayout") === "one-up"
        ? "one-up"
        : null;
  const requestedPrintPages = Number(parameters.get("printPages"));
  const initialScale = [0.5, 0.75, 1, 1.25].includes(requestedScale)
    ? requestedScale
    : 1;
  const [language, setLanguage] = useState<DocumentLanguage>(initialLanguage);
  const [reference, setReference] =
    useState<ReferenceVariant>(initialReference);
  const [scale, setScale] = useState(initialScale);
  const [reports, setReports] = useState<PageOverflowReport[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const exam =
    reference === "third-year"
      ? createThirdYearReferenceExam()
      : reference === "first-year"
        ? createFirstYearReferenceExam()
        : createRendererReferenceExam(language);

  useEffect(() => {
    void changeInterfaceLanguage(interfaceLanguage);
  }, [interfaceLanguage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rootRef.current) setReports(inspectPageOverflows(rootRef.current));
    }, 350);
    return () => clearTimeout(timer);
  }, [language, reference, scale]);

  useEffect(() => {
    if (!requestedPrintLayout) return;
    let cleanup: (() => void) | undefined;
    const timer = window.setInterval(() => {
      const host = rootRef.current;
      const printRoot = host?.querySelector<HTMLElement>(
        '[data-print-root][data-print-ready="true"]',
      );
      if (
        !host ||
        !printRoot ||
        printRoot.querySelector("[data-print-imposition]")
      ) {
        return;
      }

      const sourceRoot = printRoot.cloneNode(true) as HTMLElement;
      if (Number.isInteger(requestedPrintPages) && requestedPrintPages > 0) {
        const pages = sourceRoot.querySelectorAll<HTMLElement>(
          ".exam-pages .exam-page[data-page-number]",
        );
        pages.forEach((page, index) => {
          if (index >= requestedPrintPages) page.remove();
        });
      }
      const result = createPrintImposition({
        document,
        printRoot: sourceRoot,
        mode: requestedPrintLayout,
        documentLanguage: exam.settings.documentLanguage,
      });
      printRoot.append(result.element);
      document.documentElement.dataset.printing = "true";
      document.documentElement.dataset.printLayout = requestedPrintLayout;
      host.dataset.printQaReady = "true";
      host.dataset.logicalPageCount = String(result.logicalPageCount);
      host.dataset.physicalSheetCount = String(result.physicalSheetCount);
      const removePageStyle = installPrintPageStyle(
        document,
        requestedPrintLayout,
      );
      cleanup = () => {
        result.element.remove();
        removePageStyle();
        delete document.documentElement.dataset.printing;
        delete document.documentElement.dataset.printLayout;
        delete host.dataset.printQaReady;
      };
      window.clearInterval(timer);
    }, 50);

    return () => {
      window.clearInterval(timer);
      cleanup?.();
    };
  }, [
    exam.settings.documentLanguage,
    reference,
    requestedPrintLayout,
    requestedPrintPages,
    scale,
  ]);

  const hasOverflow = reports.some(
    (report) => report.horizontal || report.vertical,
  );

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-slate-200 p-6"
      data-print-qa-host
    >
      <div
        className="sticky top-3 z-20 mx-auto mb-6 flex max-w-4xl flex-wrap items-center gap-3 rounded-lg border bg-white p-3 shadow"
        data-preview-control
      >
        <strong>Renderer QA</strong>
        <button type="button" onClick={() => setReference("third-year")}>
          Référence 3e
        </button>
        <button type="button" onClick={() => setReference("first-year")}>
          Référence 1re
        </button>
        <button type="button" onClick={() => setReference("generic")}>
          Fixture générique
        </button>
        <button type="button" onClick={() => setLanguage("ar")}>
          العربية
        </button>
        <button type="button" onClick={() => setLanguage("fr")}>
          Français
        </button>
        {[0.5, 0.75, 1, 1.25].map((value) => (
          <button key={value} type="button" onClick={() => setScale(value)}>
            {value * 100}%
          </button>
        ))}
        <span
          className={
            hasOverflow
              ? "font-semibold text-red-700"
              : "font-semibold text-green-700"
          }
          data-testid="overflow-status"
        >
          {reports.length === 0
            ? "Mesure…"
            : hasOverflow
              ? "Overflow détecté"
              : `${reports.length} pages sans overflow`}
        </span>
      </div>
      <ExamRenderer
        exam={exam}
        assets={REFERENCE_ASSETS}
        scale={scale}
        formatPageLabel={(page, total) => `Page ${page} / ${total}`}
      />
    </div>
  );
}
