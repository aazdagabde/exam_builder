import { useContext } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import { ExamBuilderStoreContext } from "@/features/exam-builder/store/exam-builder-store.context";
import type { ExamBuilderStore } from "@/features/exam-builder/store/exam-builder.types";

export function useExamBuilderStore<Value>(
  selector: (state: ExamBuilderStore) => Value,
): Value {
  return useStore(useExamBuilderStoreApi(), selector);
}

export function useExamBuilderStoreApi(): StoreApi<ExamBuilderStore> {
  const store = useContext(ExamBuilderStoreContext);
  if (store === null) {
    throw new Error(
      "useExamBuilderStore must be used within ExamBuilderStoreProvider.",
    );
  }
  return store;
}
