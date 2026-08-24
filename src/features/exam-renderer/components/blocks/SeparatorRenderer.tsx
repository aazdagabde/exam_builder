import type { SeparatorBlock } from "@/domain/exam";

export function SeparatorRenderer({ block }: { block: SeparatorBlock }) {
  return block.style === "space" ? (
    <div className="exam-separator-space" aria-hidden="true" />
  ) : (
    <hr className="exam-separator-line" />
  );
}
