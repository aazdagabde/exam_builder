import type { ImageBlock } from "@/domain/exam";
import type { ResolvedImageAsset } from "@/features/exam-renderer/assets/renderer-assets";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function ImageRenderer({
  block,
  asset,
  labels,
  onLoad,
}: {
  block: ImageBlock;
  asset?: ResolvedImageAsset;
  labels: DocumentLabels;
  onLoad?(): void;
}) {
  const width = Math.min(100, Math.max(1, block.width ?? 100));
  const alignment = block.alignment ?? "center";
  return (
    <figure
      className={`exam-image exam-image--${alignment}`}
      style={{ width: `${width}%` }}
    >
      {block.title?.trim() ? (
        <div className="exam-image-title" dir="auto">
          {block.title}
          <DocumentPoints points={block.points} labels={labels} />
        </div>
      ) : (
        <DocumentPoints points={block.points} labels={labels} />
      )}
      {asset?.status === "ready" ? (
        <img
          className={
            block.bordered
              ? "exam-image-content exam-image-content--bordered"
              : "exam-image-content"
          }
          src={asset.objectUrl}
          alt={block.caption ?? block.title ?? ""}
          data-image-status="ready"
          data-image-id={block.imageId}
          onLoad={onLoad}
        />
      ) : asset?.status === "loading" ? (
        <div className="exam-image-placeholder" aria-hidden="true" />
      ) : (
        <div
          className="exam-image-placeholder"
          role="img"
          aria-label={labels.imageUnavailable}
          data-image-status={asset?.status ?? "missing"}
          data-image-id={block.imageId}
        >
          {labels.imageUnavailable}
        </div>
      )}
      {block.caption?.trim() ? (
        <figcaption dir="auto">{block.caption}</figcaption>
      ) : null}
      {block.source?.trim() ? (
        <div className="exam-document-reference" dir="auto">
          {labels.source}: {block.source}
        </div>
      ) : null}
    </figure>
  );
}
