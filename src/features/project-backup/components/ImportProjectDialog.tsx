import { AlertCircle, LoaderCircle, Upload } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import { useExamRepository } from "@/app/providers/useExamRepository";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatExamUpdatedAt } from "@/features/exams/services/exam-formatters";
import {
  findProjectImportCollision,
  importProjectBackup,
} from "@/features/project-backup/import-project-backup";
import { prepareProjectImport } from "@/features/project-backup/prepare-project-import";
import {
  ProjectBackupError,
  type ProjectBackupErrorCode,
} from "@/features/project-backup/project-backup.errors";
import {
  MAX_PROJECT_BACKUP_FILE_SIZE_BYTES,
  type PreparedProjectImport,
  type ProjectImportCollisionResolution,
} from "@/features/project-backup/project-backup.types";

type ImportDialogState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "validating" }
  | {
      status: "ready";
      prepared: PreparedProjectImport;
      hasCollision: boolean;
    }
  | { status: "importing"; prepared: PreparedProjectImport }
  | { status: "success" }
  | { status: "error"; code: ProjectBackupErrorCode };

function getErrorCode(error: unknown): ProjectBackupErrorCode {
  return error instanceof ProjectBackupError ? error.code : "INVALID_BACKUP";
}

function ImportSummary({ prepared }: { prepared: PreparedProjectImport }) {
  const { t, i18n } = useTranslation();
  const { exam } = prepared.backup;
  const values = [
    ["title", exam.metadata.title.trim() || t("exam.untitled")],
    ["level", exam.metadata.level || "—"],
    ["subject", exam.metadata.subject || "—"],
    ["academicYear", exam.metadata.academicYear || "—"],
    [
      "updatedAt",
      formatExamUpdatedAt(
        exam.updatedAt,
        i18n.resolvedLanguage ?? i18n.language,
      ),
    ],
    ["sections", String(exam.sections.length)],
    ["images", String(prepared.referencedAssetIds.length)],
    ["version", String(prepared.backup.backupVersion)],
  ] as const;

  return (
    <dl className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-2">
      {values.map(([key, value]) => (
        <div key={key} className="min-w-0 space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">
            {t(`projectBackup.import.summary.${key}`)}
          </dt>
          <dd dir="auto" className="break-words text-sm font-medium">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ImportProjectDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputId = useId();
  const examRepository = useExamRepository();
  const assetRepository = useAssetRepository();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ImportDialogState>({ status: "idle" });

  const reset = () => setState({ status: "idle" });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_PROJECT_BACKUP_FILE_SIZE_BYTES) {
      setState({ status: "error", code: "FILE_TOO_LARGE" });
      return;
    }

    setState({ status: "reading" });
    let source: string;
    try {
      source = await file.text();
    } catch {
      setState({ status: "error", code: "FILE_READ_FAILED" });
      return;
    }

    setState({ status: "validating" });
    try {
      const prepared = await prepareProjectImport(source);
      const collision = await findProjectImportCollision(
        prepared,
        examRepository,
      );
      setState({
        status: "ready",
        prepared,
        hasCollision: collision !== null,
      });
    } catch (error: unknown) {
      setState({ status: "error", code: getErrorCode(error) });
    }
  };

  const performImport = async (
    prepared: PreparedProjectImport,
    collisionResolution?: ProjectImportCollisionResolution,
  ) => {
    setState({ status: "importing", prepared });
    try {
      const result = await importProjectBackup({
        prepared,
        collisionResolution,
        examRepository,
        assetRepository,
      });
      if (result.status === "cancelled") {
        setOpen(false);
        reset();
        return;
      }
      setState({ status: "success" });
      navigate(`/exams/${result.exam.id}/edit`);
    } catch (error: unknown) {
      setState({ status: "error", code: getErrorCode(error) });
    }
  };

  const isBusy = state.status === "reading" || state.status === "validating";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && state.status === "importing") return;
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Upload aria-hidden="true" />
          {t("projectBackup.import.action")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("projectBackup.import.title")}</DialogTitle>
          <DialogDescription>
            {t("projectBackup.import.description")}
          </DialogDescription>
        </DialogHeader>

        {state.status === "idle" || state.status === "error" ? (
          <div className="space-y-3">
            <Label htmlFor={inputId}>
              {t("projectBackup.import.fileLabel")}
            </Label>
            <Input
              id={inputId}
              type="file"
              accept=".exam.json,application/json"
              onChange={(event) => {
                void handleFile(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t("projectBackup.import.fileHint")}
            </p>
          </div>
        ) : null}

        {isBusy ? (
          <div role="status" className="flex items-center gap-2 py-6 text-sm">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            {t(`projectBackup.import.states.${state.status}`)}
          </div>
        ) : null}

        {state.status === "ready" ? (
          <>
            <ImportSummary prepared={state.prepared} />
            {state.hasCollision ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4" />
                <span>{t("projectBackup.import.collision.description")}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("projectBackup.import.cancel")}
                </Button>
              </DialogClose>
              {state.hasCollision ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void performImport(state.prepared, "copy")}
                  >
                    {t("projectBackup.import.collision.copy")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      void performImport(state.prepared, "replace")
                    }
                  >
                    {t("projectBackup.import.collision.replace")}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => void performImport(state.prepared)}
                >
                  {t("projectBackup.import.confirm")}
                </Button>
              )}
            </div>
          </>
        ) : null}

        {state.status === "importing" ? (
          <div role="status" className="flex items-center gap-2 py-6 text-sm">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            {t("projectBackup.import.states.importing")}
          </div>
        ) : null}

        {state.status === "error" ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4" />
            <span>{t(`projectBackup.errors.${state.code}`)}</span>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
