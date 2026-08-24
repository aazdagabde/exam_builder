import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/features/exams/components/new-exam/FieldError";
import { SectionDraftEditor } from "@/features/exams/components/new-exam/SectionDraftEditor";
import type {
  NewExamSectionDraft,
  NewExamValidationErrors,
} from "@/features/exams/models/new-exam-draft";

interface ExamStructureStepProps {
  sections: NewExamSectionDraft[];
  errors: Pick<NewExamValidationErrors, "sections" | "structure">;
  isSubmitting: boolean;
  onAdd(): string;
  onUpdate(draftId: string, title: string): void;
  onRemove(draftId: string): void;
  onBack(): void;
  onSubmit(): Promise<void>;
}

export function ExamStructureStep({
  sections,
  errors,
  isSubmitting,
  onAdd,
  onUpdate,
  onRemove,
  onBack,
  onSubmit,
}: ExamStructureStepProps) {
  const { t } = useTranslation();
  const [lastAddedId, setLastAddedId] = useState<string>();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  const addSection = () => {
    setLastAddedId(onAdd());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t("newExam.sections.title")}
        </CardTitle>
        <CardDescription>{t("newExam.sections.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={submit} noValidate>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <SectionDraftEditor
                key={section.draftId}
                section={section}
                index={index}
                error={
                  errors.sections[section.draftId]
                    ? t(errors.sections[section.draftId])
                    : undefined
                }
                autoFocus={section.draftId === lastAddedId}
                onChange={(title) => onUpdate(section.draftId, title)}
                onRemove={() => onRemove(section.draftId)}
              />
            ))}
          </div>

          <FieldError
            id="new-exam-structure-error"
            message={errors.structure ? t(errors.structure) : undefined}
          />

          <Button type="button" variant="outline" onClick={addSection}>
            <Plus aria-hidden="true" />
            {t("newExam.sections.add")}
          </Button>

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onBack}
            >
              {t("newExam.actions.back")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("newExam.actions.creating")
                : t("newExam.actions.create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
