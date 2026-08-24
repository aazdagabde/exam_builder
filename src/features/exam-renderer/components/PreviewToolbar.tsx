import { ZoomIn } from "lucide-react";
import { useTranslation } from "react-i18next";

export type PreviewZoom = 50 | 75 | 100 | 125 | "fit";

const ZOOM_LEVELS: PreviewZoom[] = [50, 75, 100, 125, "fit"];

export function PreviewToolbar({
  zoom,
  onZoomChange,
  pageCount,
}: {
  zoom: PreviewZoom;
  onZoomChange(zoom: PreviewZoom): void;
  pageCount: number;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b bg-card px-3 py-2"
      data-preview-control
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <ZoomIn className="size-4" aria-hidden="true" />
        {t("examRenderer.preview.title")}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <label className="sr-only" htmlFor="exam-preview-zoom">
          {t("examRenderer.preview.zoomLabel")}
        </label>
        <select
          id="exam-preview-zoom"
          className="h-8 max-w-32 rounded-md border bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          value={String(zoom)}
          onChange={(event) => {
            const value = event.target.value;
            onZoomChange(
              value === "fit" ? "fit" : (Number(value) as PreviewZoom),
            );
          }}
        >
          {ZOOM_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level === "fit" ? t("examRenderer.preview.fit") : `${level}%`}
            </option>
          ))}
        </select>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {t("examRenderer.preview.pageCount", { count: pageCount })}
      </span>
    </div>
  );
}
