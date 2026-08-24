import { useCallback, useRef, useState } from "react";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import {
  ensureExamSaved,
  ExamSaveBarrierError,
} from "@/features/exam-builder/services/ensure-exam-saved";
import { useExamBuilderStoreApi } from "@/features/exam-builder/store/useExamBuilderStore";
import type { ExportExamDocxErrorCode } from "@/features/export-docx/services/export-exam-docx";

export type ExportDocxErrorCode =
  "NO_EXAM" | "SAVE_FAILED" | ExportExamDocxErrorCode;

export type ExportDocxStatus = "idle" | "preparing" | "generating" | "error";

interface ExportDocxState {
  status: ExportDocxStatus;
  errorCode: ExportDocxErrorCode | null;
  unavailableImageCount: number;
  logoUnavailable: boolean;
}

const INITIAL_STATE: ExportDocxState = {
  status: "idle",
  errorCode: null,
  unavailableImageCount: 0,
  logoUnavailable: false,
};

export function useExportExamDocx(saveNow: () => Promise<void>) {
  const store = useExamBuilderStoreApi();
  const assetRepository = useAssetRepository();
  const inProgress = useRef(false);
  const [state, setState] = useState<ExportDocxState>(INITIAL_STATE);

  const exportDocx = useCallback(async () => {
    if (inProgress.current) return;
    inProgress.current = true;
    setState({
      status: "preparing",
      errorCode: null,
      unavailableImageCount: 0,
      logoUnavailable: false,
    });

    try {
      await ensureExamSaved(store, saveNow);
      const exam = store.getState().exam;
      if (exam === null) throw new ExamSaveBarrierError("NO_EXAM");

      setState((current) => ({ ...current, status: "generating" }));
      const { exportExamDocx, ExportExamDocxError } =
        await import("@/features/export-docx/services/export-exam-docx");
      try {
        const created = await exportExamDocx({
          exam,
          assetResolver: assetRepository,
        });
        setState({
          status: "idle",
          errorCode: null,
          unavailableImageCount: created.unavailableImageCount,
          logoUnavailable: created.imageWarnings.some(
            (warning) => warning.code === "LOGO_UNAVAILABLE",
          ),
        });
      } catch (error) {
        if (error instanceof ExportExamDocxError) {
          setState({
            status: "error",
            errorCode: error.code,
            unavailableImageCount: 0,
            logoUnavailable: false,
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      setState({
        status: "error",
        errorCode:
          error instanceof ExamSaveBarrierError
            ? error.code
            : "GENERATION_FAILED",
        unavailableImageCount: 0,
        logoUnavailable: false,
      });
    } finally {
      inProgress.current = false;
    }
  }, [assetRepository, saveNow, store]);

  return { ...state, exportDocx };
}
