import { createContext } from "react";

import type { ExamRepository } from "@/domain/repositories/exam-repository";

export const ExamRepositoryContext = createContext<ExamRepository | null>(null);
