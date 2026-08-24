import type { PageBreakBlock } from "@/domain/exam";

export function PageBreakRenderer({ block }: { block: PageBreakBlock }) {
  return (
    <span
      className="exam-page-break"
      data-block-id={block.id}
      aria-hidden="true"
    />
  );
}
