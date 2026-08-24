import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useExamRepository } from "@/app/providers/useExamRepository";
import type { Exam, ExamId } from "@/domain/exam";
import {
  ExamService,
  sortExamsByUpdatedAt,
} from "@/features/exams/services/exam-service";

export type ExamsLoadState =
  | { status: "loading"; exams: [] }
  | { status: "success"; exams: Exam[] }
  | { status: "error"; exams: []; error: unknown };

export type ExamActionFeedback =
  "duplicated" | "deleted" | "duplicateError" | "deleteError";

export interface PendingExamAction {
  examId: ExamId;
  type: "duplicate" | "delete";
}

export function useExams() {
  const repository = useExamRepository();
  const service = useMemo(() => new ExamService(repository), [repository]);
  const requestId = useRef(0);
  const [state, setState] = useState<ExamsLoadState>({
    status: "loading",
    exams: [],
  });
  const [pendingAction, setPendingAction] = useState<PendingExamAction | null>(
    null,
  );
  const [feedback, setFeedback] = useState<ExamActionFeedback | null>(null);

  const reload = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setFeedback(null);
    setState({ status: "loading", exams: [] });

    try {
      const exams = await service.findAll();

      if (requestId.current === currentRequestId) {
        setState({ status: "success", exams });
      }
    } catch (error: unknown) {
      if (requestId.current === currentRequestId) {
        setState({ status: "error", exams: [], error });
      }
    }
  }, [service]);

  useEffect(() => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    void service
      .findAll()
      .then((exams) => {
        if (requestId.current === currentRequestId) {
          setState({ status: "success", exams });
        }
      })
      .catch((error: unknown) => {
        if (requestId.current === currentRequestId) {
          setState({ status: "error", exams: [], error });
        }
      });

    return () => {
      requestId.current += 1;
    };
  }, [service]);

  const duplicateExamById = useCallback(
    async (examId: ExamId): Promise<boolean> => {
      if (state.status !== "success") {
        return false;
      }

      const source = state.exams.find((exam) => exam.id === examId);
      if (!source) {
        return false;
      }

      setFeedback(null);
      setPendingAction({ examId, type: "duplicate" });

      try {
        const duplicate = await service.duplicate(source);
        setState((currentState) =>
          currentState.status === "success"
            ? {
                status: "success",
                exams: sortExamsByUpdatedAt([duplicate, ...currentState.exams]),
              }
            : currentState,
        );
        setFeedback("duplicated");
        return true;
      } catch {
        setFeedback("duplicateError");
        return false;
      } finally {
        setPendingAction(null);
      }
    },
    [service, state],
  );

  const deleteExamById = useCallback(
    async (examId: ExamId): Promise<boolean> => {
      setFeedback(null);
      setPendingAction({ examId, type: "delete" });

      try {
        await service.delete(examId);
        setState((currentState) =>
          currentState.status === "success"
            ? {
                status: "success",
                exams: currentState.exams.filter((exam) => exam.id !== examId),
              }
            : currentState,
        );
        setFeedback("deleted");
        return true;
      } catch {
        setFeedback("deleteError");
        return false;
      } finally {
        setPendingAction(null);
      }
    },
    [service],
  );

  return {
    state,
    pendingAction,
    feedback,
    reload,
    duplicateExamById,
    deleteExamById,
  };
}
