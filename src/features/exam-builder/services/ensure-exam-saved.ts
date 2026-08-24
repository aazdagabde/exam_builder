import type { StoreApi } from "zustand/vanilla";

import type { ExamBuilderStore } from "@/features/exam-builder/store/exam-builder.types";

export type ExamSaveBarrierErrorCode = "NO_EXAM" | "SAVE_FAILED";

export class ExamSaveBarrierError extends Error {
  constructor(public readonly code: ExamSaveBarrierErrorCode) {
    super(code);
    this.name = "ExamSaveBarrierError";
  }
}

/** Flushes every revision produced while a save is in flight before export. */
export async function ensureExamSaved(
  store: StoreApi<ExamBuilderStore>,
  saveNow: () => Promise<void>,
): Promise<void> {
  for (;;) {
    const before = store.getState();
    if (before.exam === null) throw new ExamSaveBarrierError("NO_EXAM");
    if (before.revision <= before.savedRevision) return;

    await saveNow();
    const after = store.getState();
    if (after.saveStatus === "error") {
      throw new ExamSaveBarrierError("SAVE_FAILED");
    }
    if (after.revision <= after.savedRevision) return;

    if (
      after.revision === before.revision &&
      after.savedRevision === before.savedRevision
    ) {
      throw new ExamSaveBarrierError("SAVE_FAILED");
    }
  }
}
