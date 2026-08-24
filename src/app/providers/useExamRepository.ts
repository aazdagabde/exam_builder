import { useContext } from "react";

import { ExamRepositoryContext } from "@/app/providers/exam-repository.context";
import type { ExamRepository } from "@/domain/repositories/exam-repository";

export function useExamRepository(): ExamRepository {
  const repository = useContext(ExamRepositoryContext);

  if (repository === null) {
    throw new Error(
      "useExamRepository must be used within ExamRepositoryProvider.",
    );
  }

  return repository;
}
