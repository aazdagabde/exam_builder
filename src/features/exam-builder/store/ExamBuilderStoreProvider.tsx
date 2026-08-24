import type { PropsWithChildren } from "react";
import type { StoreApi } from "zustand/vanilla";

import { ExamBuilderStoreContext } from "@/features/exam-builder/store/exam-builder-store.context";
import type { ExamBuilderStore } from "@/features/exam-builder/store/exam-builder.types";

interface ExamBuilderStoreProviderProps extends PropsWithChildren {
  store: StoreApi<ExamBuilderStore>;
}

export function ExamBuilderStoreProvider({
  store,
  children,
}: ExamBuilderStoreProviderProps) {
  return (
    <ExamBuilderStoreContext.Provider value={store}>
      {children}
    </ExamBuilderStoreContext.Provider>
  );
}
