import type { PropsWithChildren } from "react";

import { ExamRepositoryContext } from "@/app/providers/exam-repository.context";
import type { ExamRepository } from "@/domain/repositories/exam-repository";

interface ExamRepositoryProviderProps extends PropsWithChildren {
  repository: ExamRepository;
}

export function ExamRepositoryProvider({
  repository,
  children,
}: ExamRepositoryProviderProps) {
  return (
    <ExamRepositoryContext.Provider value={repository}>
      {children}
    </ExamRepositoryContext.Provider>
  );
}
