import type { Exam } from "@/domain/exam";

export function collectReferencedAssetIds(exam: Exam): string[] {
  const ids = new Set<string>();

  exam.sections.forEach((section) => {
    section.blocks.forEach((block) => {
      if (block.type === "image") ids.add(block.imageId);
    });
  });

  return [...ids];
}

export function remapExamAssetIds(
  exam: Exam,
  assetIds: ReadonlyMap<string, string>,
): Exam {
  return {
    ...exam,
    sections: exam.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) =>
        block.type === "image"
          ? { ...block, imageId: assetIds.get(block.imageId) ?? block.imageId }
          : block,
      ),
    })),
  };
}
