import { useRef, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  DEFAULT_EXAM_TEMPLATE_ID,
  DEFAULT_LEVELS,
  DOCUMENT_LANGUAGE_OPTIONS,
} from "@/features/exams/constants/new-exam";
import type {
  NewExamDraft,
  NewExamValidationErrors,
} from "@/features/exams/models/new-exam-draft";
import { FieldError } from "@/features/exams/components/new-exam/FieldError";

interface ExamInformationStepProps {
  draft: NewExamDraft;
  errors: NewExamValidationErrors["information"];
  onUpdate<Field extends keyof Omit<NewExamDraft, "sections">>(
    field: Field,
    value: NewExamDraft[Field],
  ): void;
  onContinue(): boolean;
  onCancel(): void;
}

interface FieldShellProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FieldShell({
  label,
  htmlFor,
  required = false,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {children}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}

export function ExamInformationStep({
  draft,
  errors,
  onUpdate,
  onContinue,
  onCancel,
}: ExamInformationStepProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onContinue()) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t("newExam.information.title")}
        </CardTitle>
        <CardDescription>
          {t("newExam.information.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} className="space-y-6" onSubmit={submit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldShell
                htmlFor="new-exam-title"
                label={t("newExam.fields.title")}
                required
                error={errors.title ? t(errors.title) : undefined}
              >
                <Input
                  id="new-exam-title"
                  name="title"
                  dir="auto"
                  value={draft.title}
                  placeholder={t("newExam.placeholders.title")}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "new-exam-title-error" : undefined
                  }
                  onChange={(event) => onUpdate("title", event.target.value)}
                />
              </FieldShell>
            </div>

            <FieldShell
              htmlFor="new-exam-level"
              label={t("newExam.fields.level")}
              required
              error={errors.level ? t(errors.level) : undefined}
            >
              <NativeSelect
                id="new-exam-level"
                name="level"
                value={draft.level}
                aria-invalid={Boolean(errors.level)}
                aria-describedby={
                  errors.level ? "new-exam-level-error" : undefined
                }
                onChange={(event) => onUpdate("level", event.target.value)}
              >
                <option value="">{t("newExam.placeholders.level")}</option>
                {DEFAULT_LEVELS.map((level) => (
                  <option key={level} value={level} dir="rtl">
                    {level}
                  </option>
                ))}
              </NativeSelect>
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-subject"
              label={t("newExam.fields.subject")}
              required
              error={errors.subject ? t(errors.subject) : undefined}
            >
              <Input
                id="new-exam-subject"
                name="subject"
                dir="auto"
                value={draft.subject}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={
                  errors.subject ? "new-exam-subject-error" : undefined
                }
                onChange={(event) => onUpdate("subject", event.target.value)}
              />
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-academic-year"
              label={t("newExam.fields.academicYear")}
              required
              error={errors.academicYear ? t(errors.academicYear) : undefined}
            >
              <Input
                id="new-exam-academic-year"
                name="academicYear"
                inputMode="numeric"
                value={draft.academicYear}
                aria-invalid={Boolean(errors.academicYear)}
                aria-describedby={
                  errors.academicYear
                    ? "new-exam-academic-year-error"
                    : undefined
                }
                onChange={(event) =>
                  onUpdate("academicYear", event.target.value)
                }
              />
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-number"
              label={t("newExam.fields.examNumber")}
            >
              <Input
                id="new-exam-number"
                name="examNumber"
                dir="auto"
                value={draft.examNumber}
                onChange={(event) => onUpdate("examNumber", event.target.value)}
              />
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-duration"
              label={t("newExam.fields.duration")}
              error={
                errors.durationMinutes ? t(errors.durationMinutes) : undefined
              }
            >
              <Input
                id="new-exam-duration"
                name="durationMinutes"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={draft.durationMinutes ?? ""}
                aria-invalid={Boolean(errors.durationMinutes)}
                aria-describedby={
                  errors.durationMinutes
                    ? "new-exam-duration-error"
                    : "new-exam-duration-description"
                }
                onChange={(event) =>
                  onUpdate(
                    "durationMinutes",
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
              />
              {!errors.durationMinutes ? (
                <p
                  id="new-exam-duration-description"
                  className="text-xs text-muted-foreground"
                >
                  {t("newExam.hints.duration")}
                </p>
              ) : null}
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-teacher"
              label={t("newExam.fields.teacher")}
            >
              <Input
                id="new-exam-teacher"
                name="teacherName"
                dir="auto"
                value={draft.teacherName}
                onChange={(event) =>
                  onUpdate("teacherName", event.target.value)
                }
              />
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-institution"
              label={t("newExam.fields.institution")}
            >
              <Input
                id="new-exam-institution"
                name="institution"
                dir="auto"
                value={draft.institution}
                onChange={(event) =>
                  onUpdate("institution", event.target.value)
                }
              />
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-document-language"
              label={t("newExam.fields.documentLanguage")}
            >
              <NativeSelect
                id="new-exam-document-language"
                name="documentLanguage"
                value={draft.documentLanguage}
                onChange={(event) =>
                  onUpdate(
                    "documentLanguage",
                    event.target.value as NewExamDraft["documentLanguage"],
                  )
                }
              >
                {DOCUMENT_LANGUAGE_OPTIONS.map((language) => (
                  <option
                    key={language.value}
                    value={language.value}
                    lang={language.value}
                    dir={language.direction}
                  >
                    {language.label}
                  </option>
                ))}
              </NativeSelect>
            </FieldShell>

            <FieldShell
              htmlFor="new-exam-template"
              label={t("newExam.fields.template")}
            >
              <NativeSelect
                id="new-exam-template"
                name="templateId"
                value={draft.templateId}
                onChange={(event) => onUpdate("templateId", event.target.value)}
              >
                <option value={DEFAULT_EXAM_TEMPLATE_ID}>
                  {t("newExam.templates.moroccanCollegeClassic")}
                </option>
              </NativeSelect>
            </FieldShell>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("newExam.actions.cancel")}
            </Button>
            <Button type="submit">{t("newExam.actions.continue")}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
