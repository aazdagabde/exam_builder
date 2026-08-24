import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Exam } from "@/domain/exam";
import {
  useResolvedImageAssets,
  type ImageAssetResolver,
} from "@/features/exam-renderer/assets/renderer-assets";
import { ExamRenderer } from "@/features/exam-renderer/components/ExamRenderer";
import {
  PreviewToolbar,
  type PreviewZoom,
} from "@/features/exam-renderer/components/PreviewToolbar";
import { calculateFitScale } from "@/features/exam-renderer/components/preview-zoom";

export function ExamPreview({
  exam,
  assetResolver,
  renderRevision,
}: {
  exam: Exam;
  assetResolver: ImageAssetResolver;
  renderRevision?: number;
}) {
  const { t } = useTranslation();
  const assets = useResolvedImageAssets(exam, assetResolver);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<PreviewZoom>("fit");
  const [fitScale, setFitScale] = useState(0.65);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setFitScale(calculateFitScale(viewport.clientWidth));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const scale = zoom === "fit" ? fitScale : zoom / 100;
  const formatPageLabel = useMemo(
    () => (page: number, total: number) =>
      t("examRenderer.preview.pageLabel", { page, total }),
    [t],
  );

  return (
    <aside
      className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"
      aria-label={t("examRenderer.preview.title")}
    >
      <PreviewToolbar
        zoom={zoom}
        onZoomChange={setZoom}
        pageCount={pageCount}
      />
      <div ref={viewportRef} className="exam-preview-viewport">
        <ExamRenderer
          exam={exam}
          assets={assets}
          scale={scale}
          renderRevision={renderRevision}
          formatPageLabel={formatPageLabel}
          onPageCountChange={setPageCount}
        />
      </div>
    </aside>
  );
}
