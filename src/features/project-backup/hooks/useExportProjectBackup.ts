import { useCallback, useState } from "react";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import type { Exam } from "@/domain/exam";
import {
  createProjectBackup,
  downloadProjectBackup,
} from "@/features/project-backup/export-project-backup";
import {
  ProjectBackupError,
  type ProjectBackupErrorCode,
} from "@/features/project-backup/project-backup.errors";

export type ProjectExportState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "error"; code: ProjectBackupErrorCode };

export function useExportProjectBackup(exam: Exam) {
  const assetRepository = useAssetRepository();
  const [state, setState] = useState<ProjectExportState>({ status: "idle" });

  const exportProject = useCallback(async () => {
    if (state.status === "preparing") return;
    setState({ status: "preparing" });

    try {
      const backup = await createProjectBackup({ exam, assetRepository });
      downloadProjectBackup(backup);
      setState({ status: "idle" });
    } catch (error: unknown) {
      setState({
        status: "error",
        code:
          error instanceof ProjectBackupError
            ? error.code
            : "ASSET_READ_FAILED",
      });
    }
  }, [assetRepository, exam, state.status]);

  return { state, exportProject };
}
