import { useCallback, useRef, useState } from "react";

import { useExamBuilderStoreApi } from "@/features/exam-builder/store/useExamBuilderStore";
import {
  ensureExamSaved,
  ExamSaveBarrierError,
} from "@/features/exam-builder/services/ensure-exam-saved";
import {
  prepareExamForPrint,
  PrintPreparationError,
  printPreparedExam,
  type PrintPreparationErrorCode,
} from "@/features/export-pdf/services/print-exam";
import type { PrintLayoutMode } from "@/features/export-pdf/services/print-imposition";

export type PrintExamStatus = "idle" | "preparing" | "printing" | "error";

export interface PrintExamState {
  status: PrintExamStatus;
  errorCode: PrintPreparationErrorCode | null;
  unavailableImageCount: number;
}

const INITIAL_STATE: PrintExamState = {
  status: "idle",
  errorCode: null,
  unavailableImageCount: 0,
};

export function usePrintExam(saveNow: () => Promise<void>) {
  const store = useExamBuilderStoreApi();
  const inProgressRef = useRef(false);
  const [state, setState] = useState<PrintExamState>(INITIAL_STATE);

  const ensureSaved = useCallback(async () => {
    try {
      await ensureExamSaved(store, saveNow);
    } catch (error) {
      if (error instanceof ExamSaveBarrierError) {
        throw new PrintPreparationError(error.code);
      }
      throw error;
    }
  }, [saveNow, store]);

  const exportPdf = useCallback(
    async (layoutMode: PrintLayoutMode) => {
      if (inProgressRef.current) return false;
      inProgressRef.current = true;
      setState({
        status: "preparing",
        errorCode: null,
        unavailableImageCount: 0,
      });

      try {
        const prepared = await prepareExamForPrint({
          document,
          getSnapshot: () => {
            const current = store.getState();
            return { exam: current.exam, revision: current.revision };
          },
          ensureSaved,
        });

        setState({
          status: "printing",
          errorCode: null,
          unavailableImageCount: prepared.unavailableImageCount,
        });
        await printPreparedExam({
          document,
          window,
          exam: prepared.exam,
          root: prepared.root,
          layoutMode,
        });
        setState({
          status: "idle",
          errorCode: null,
          unavailableImageCount: prepared.unavailableImageCount,
        });
        return true;
      } catch (error) {
        setState({
          status: "error",
          errorCode:
            error instanceof PrintPreparationError
              ? error.code
              : "PRINT_FAILED",
          unavailableImageCount: 0,
        });
        return false;
      } finally {
        inProgressRef.current = false;
      }
    },
    [ensureSaved, store],
  );

  return { ...state, exportPdf };
}
