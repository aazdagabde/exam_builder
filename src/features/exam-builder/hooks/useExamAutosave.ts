import { useCallback, useEffect, useRef } from "react";

import { useExamRepository } from "@/app/providers/useExamRepository";
import { ExamSchema } from "@/domain/exam";
import { AUTOSAVE_DELAY_MS } from "@/features/exam-builder/constants";
import { useExamBuilderStoreApi } from "@/features/exam-builder/store/useExamBuilderStore";

export function useExamAutosave(delay = AUTOSAVE_DELAY_MS) {
  const repository = useExamRepository();
  const store = useExamBuilderStoreApi();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const pendingRef = useRef(false);
  const mountedRef = useRef(true);
  const activeRevisionRef = useRef<number | null>(null);
  const runningPromiseRef = useRef<Promise<void>>(Promise.resolve());

  const saveLatest = useCallback((): Promise<void> => {
    if (runningRef.current) {
      pendingRef.current = true;
      return runningPromiseRef.current;
    }

    const run = async () => {
      runningRef.current = true;
      try {
        do {
          pendingRef.current = false;
          const state = store.getState();
          if (
            state.status !== "ready" ||
            state.exam === null ||
            state.revision <= state.savedRevision
          ) {
            break;
          }

          const revision = state.revision;
          const examId = state.exam.id;
          const snapshot = ExamSchema.parse(structuredClone(state.exam));
          activeRevisionRef.current = revision;
          state.startSaving(revision);

          try {
            await repository.save(snapshot);
            if (mountedRef.current && store.getState().exam?.id === examId) {
              store.getState().completeSave(revision);
            }
          } catch {
            if (mountedRef.current && store.getState().exam?.id === examId) {
              store.getState().failSave(revision);
            }
          } finally {
            activeRevisionRef.current = null;
          }
        } while (pendingRef.current);
      } finally {
        runningRef.current = false;
      }
    };

    runningPromiseRef.current = run();
    return runningPromiseRef.current;
  }, [repository, store]);

  const saveNow = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return saveLatest();
  }, [saveLatest]);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.status !== "ready" || state.revision === previous.revision) {
        return;
      }

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void saveLatest();
      }, delay);
    });

    return () => {
      unsubscribe();
      mountedRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const state = store.getState();
      if (
        state.exam !== null &&
        state.revision > state.savedRevision &&
        activeRevisionRef.current !== state.revision &&
        !pendingRef.current
      ) {
        const snapshot = ExamSchema.parse(structuredClone(state.exam));
        void runningPromiseRef.current
          .catch(() => undefined)
          .then(() => repository.save(snapshot))
          .catch(() => undefined);
      }
    };
  }, [delay, repository, saveLatest, store]);

  return saveNow;
}
