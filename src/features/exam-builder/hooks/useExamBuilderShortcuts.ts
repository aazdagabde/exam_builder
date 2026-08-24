import { useEffect } from "react";

import { useExamBuilderStoreApi } from "@/features/exam-builder/store/useExamBuilderStore";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches("input, textarea, select") || target.isContentEditable;
}

export function useExamBuilderShortcuts() {
  const store = useExamBuilderStoreApi();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || !(event.ctrlKey || event.metaKey)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        store.getState().redo();
      } else if (key === "z") {
        event.preventDefault();
        store.getState().undo();
      } else if (key === "y") {
        event.preventDefault();
        store.getState().redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);
}
