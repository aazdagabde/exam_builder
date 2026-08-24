import { useCallback, useEffect, useState } from "react";

import { useExamRepository } from "@/app/providers/useExamRepository";
import { ExamMigrationError, type Exam } from "@/domain/exam";
import { useExamBuilderStoreApi } from "@/features/exam-builder/store/useExamBuilderStore";

export function useLoadExam(examId: string, initialExam: Exam | null = null) {
  const repository = useExamRepository();
  const store = useExamBuilderStoreApi();
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (initialExam !== null) {
      store.getState().initialize(initialExam);
      return;
    }

    let active = true;
    store.getState().startLoading();

    void repository
      .findById(examId)
      .then((exam) => {
        if (!active) return;
        if (exam === null) {
          store.getState().setNotFound();
          return;
        }
        store.getState().initialize(exam);
      })
      .catch((error: unknown) => {
        if (active) {
          store
            .getState()
            .setLoadError(
              error instanceof ExamMigrationError &&
                error.code === "UNSUPPORTED_FUTURE_EXAM_SCHEMA"
                ? error.code
                : "EXAM_LOAD_FAILED",
            );
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, examId, initialExam, repository, store]);

  return retry;
}
