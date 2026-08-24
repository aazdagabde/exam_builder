import { useEffect, useState } from "react";

interface PanelMetrics {
  display: string;
  width: number;
  height: number;
}

interface BuilderLayoutReport {
  viewport: { width: number; height: number };
  document: {
    clientWidth: number;
    scrollWidth: number;
    clientHeight: number;
    scrollHeight: number;
    scrollY: number;
  };
  panels: Record<string, PanelMetrics>;
  pageCount: number;
  documentTextLength: number;
}

function readPanel(selector: string): PanelMetrics {
  const element = document.querySelector<HTMLElement>(selector);
  const rect = element?.getBoundingClientRect();
  return {
    display: element ? getComputedStyle(element).display : "missing",
    width: Math.round(rect?.width ?? 0),
    height: Math.round(rect?.height ?? 0),
  };
}

function readReport(): BuilderLayoutReport {
  const renderedDocument = document.querySelector(".exam-pages");
  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    document: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
      scrollY: Math.round(window.scrollY),
    },
    panels: {
      structure: readPanel(".builder-pane--structure"),
      editor: readPanel(".builder-pane--editor"),
      preview: readPanel(".builder-pane--preview"),
    },
    pageCount: document.querySelectorAll(".exam-pages .exam-page").length,
    documentTextLength: renderedDocument?.textContent?.length ?? 0,
  };
}

export function BuilderLayoutDiagnostics() {
  const [report, setReport] = useState<BuilderLayoutReport | null>(null);

  useEffect(() => {
    const update = () => setReport(readReport());
    const parameters = new URLSearchParams(window.location.search);
    const scrollTimer = window.setTimeout(() => {
      if (parameters.get("qaScroll") === "block-editor") {
        const panel = document.querySelector<HTMLElement>(
          ".builder-pane--editor",
        );
        const target = panel?.querySelector<HTMLElement>(".block-editor-shell");
        if (panel && target) {
          const panelTop = panel.getBoundingClientRect().top;
          const targetTop = target.getBoundingClientRect().top;
          panel.scrollTop += targetTop - panelTop - 8;
        }
      }
    }, 350);
    const reportTimers = [750, 3000, 5500].map((delay) =>
      window.setTimeout(update, delay),
    );
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => {
      reportTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(scrollTimer);
      observer.disconnect();
    };
  }, []);

  return (
    <output id="builder-layout-report" className="sr-only">
      {report ? JSON.stringify(report) : "measuring"}
    </output>
  );
}
