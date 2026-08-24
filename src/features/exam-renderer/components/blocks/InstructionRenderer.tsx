import type { InstructionBlock } from "@/domain/exam";

export function InstructionRenderer({ block }: { block: InstructionBlock }) {
  if (!block.content.trim()) return null;
  return (
    <p className="exam-instruction" dir="auto">
      {block.content}
    </p>
  );
}
