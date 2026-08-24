import type { FreeTextBlock } from "@/domain/exam";

export function FreeTextRenderer({ block }: { block: FreeTextBlock }) {
  if (!block.content.trim()) return null;
  const variant = block.variant ?? "paragraph";
  return (
    <div className={`exam-free-text exam-free-text--${variant}`} dir="auto">
      {block.content}
    </div>
  );
}
