import { useEffect, useState } from "react";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import type { Exam } from "@/domain/exam";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";
import { ExamPreview } from "@/features/exam-renderer/components/ExamPreview";

export function BuilderExamPreview() {
  const exam = useExamBuilderStore((state) => state.exam);
  const revision = useExamBuilderStore((state) => state.revision);
  const assetRepository = useAssetRepository();
  if (exam === null) return null;
  return (
    <DebouncedExamPreview
      exam={exam}
      revision={revision}
      assetRepository={assetRepository}
    />
  );
}

function DebouncedExamPreview({
  exam,
  revision,
  assetRepository,
}: {
  exam: Exam;
  revision: number;
  assetRepository: ReturnType<typeof useAssetRepository>;
}) {
  const [preview, setPreview] = useState({ exam, revision });
  useEffect(() => {
    const timer = setTimeout(() => setPreview({ exam, revision }), 100);
    return () => clearTimeout(timer);
  }, [exam, revision]);
  return (
    <ExamPreview
      exam={preview.exam}
      assetResolver={assetRepository}
      renderRevision={preview.revision}
    />
  );
}
