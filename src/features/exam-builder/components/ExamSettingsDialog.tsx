import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { getQuestionNumberingSettings } from "@/domain/exam";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

const TITLE_HISTORY_GROUP = "exam-metadata:title";

export function ExamSettingsDialog() {
  const { t } = useTranslation();
  const exam = useExamBuilderStore((state) => state.exam);
  const updateExamDetails = useExamBuilderStore(
    (state) => state.updateExamDetails,
  );
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);

  if (!exam) return null;
  const questionNumbering = getQuestionNumberingSettings(exam);

  const studentFieldOptions = [
    ["showFullName", "fullName"],
    ["showStudentNumber", "studentNumber"],
    ["showClassName", "className"],
    ["showGrade", "grade"],
  ] as const;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("examBuilder.examSettings.open")}
        >
          <Settings2 aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("examBuilder.examSettings.title")}</DialogTitle>
          <DialogDescription>
            {t("examBuilder.examSettings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="exam-settings-title">
              {t("examBuilder.examSettings.fields.title")}
            </Label>
            <Input
              id="exam-settings-title"
              dir="auto"
              value={exam.metadata.title}
              onChange={(event) =>
                updateExamDetails(
                  { metadata: { title: event.target.value } },
                  { historyGroup: TITLE_HISTORY_GROUP },
                )
              }
              onBlur={() => endHistoryGroup(TITLE_HISTORY_GROUP)}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="exam-settings-language">
              {t("examBuilder.examSettings.fields.documentLanguage")}
            </Label>
            <NativeSelect
              id="exam-settings-language"
              value={exam.settings.documentLanguage}
              onChange={(event) =>
                updateExamDetails({
                  settings: {
                    documentLanguage: event.target.value as "ar" | "fr",
                  },
                })
              }
            >
              <option value="ar" lang="ar" dir="rtl">
                العربية
              </option>
              <option value="fr" lang="fr" dir="ltr">
                Français
              </option>
            </NativeSelect>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="exam-settings-total">
              {t("examBuilder.examSettings.fields.totalPoints")}
            </Label>
            <Input
              id="exam-settings-total"
              type="number"
              min="0"
              step="0.5"
              value={exam.metadata.totalPoints ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                updateExamDetails({
                  metadata: {
                    totalPoints: value === "" ? undefined : Number(value),
                  },
                });
              }}
            />
          </div>

          <fieldset className="min-w-0 space-y-3 rounded-lg border p-4 sm:col-span-2">
            <legend className="px-1 text-sm font-medium">
              {t("examBuilder.examSettings.studentFields.title")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {studentFieldOptions.map(([field, label]) => (
                <label
                  key={field}
                  className="flex min-w-0 items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-primary"
                    checked={exam.studentFields[field]}
                    onChange={(event) =>
                      updateExamDetails({
                        studentFields: { [field]: event.target.checked },
                      })
                    }
                  />
                  <span>
                    {t(`examBuilder.examSettings.studentFields.${label}`)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex min-w-0 items-center gap-3 rounded-lg border p-4 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={exam.settings.showTotalPoints}
              onChange={(event) =>
                updateExamDetails({
                  settings: { showTotalPoints: event.target.checked },
                })
              }
            />
            <span>{t("examBuilder.examSettings.fields.showTotalPoints")}</span>
          </label>

          <fieldset className="min-w-0 space-y-3 rounded-lg border p-4 sm:col-span-2">
            <legend className="px-1 text-sm font-medium">
              {t("examBuilder.questionNumbering.title")}
            </legend>
            <label className="flex min-w-0 items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={questionNumbering.enabled}
                onChange={(event) =>
                  updateExamDetails({
                    settings: {
                      questionNumbering: {
                        ...questionNumbering,
                        enabled: event.target.checked,
                      },
                    },
                  })
                }
              />
              <span>{t("examBuilder.questionNumbering.enabled")}</span>
            </label>
            <label className="flex min-w-0 items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={questionNumbering.restartPerSection}
                disabled={!questionNumbering.enabled}
                onChange={(event) =>
                  updateExamDetails({
                    settings: {
                      questionNumbering: {
                        ...questionNumbering,
                        restartPerSection: event.target.checked,
                      },
                    },
                  })
                }
              />
              <span>
                {t("examBuilder.questionNumbering.restartPerSection")}
              </span>
            </label>
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  );
}
