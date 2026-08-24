import { createContext } from "react";
import type { StoreApi } from "zustand/vanilla";

import type { ExamBuilderStore } from "@/features/exam-builder/store/exam-builder.types";

export const ExamBuilderStoreContext =
  createContext<StoreApi<ExamBuilderStore> | null>(null);
