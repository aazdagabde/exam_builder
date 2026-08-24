import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/exams/components/new-exam/FieldError";
import type { NewExamSectionDraft } from "@/features/exams/models/new-exam-draft";

interface SectionDraftEditorProps {
  section: NewExamSectionDraft;
  index: number;
  error?: string;
  autoFocus?: boolean;
  onChange(title: string): void;
  onRemove(): void;
}

export function SectionDraftEditor({
  section,
  index,
  error,
  autoFocus = false,
  onChange,
  onRemove,
}: SectionDraftEditorProps) {
  const { t } = useTranslation();
  const inputId = `new-exam-section-${section.draftId}`;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={inputId}>
            {t("newExam.sections.itemLabel", { number: index + 1 })}
            <span aria-hidden="true" className="ms-1 text-destructive">
              *
            </span>
          </Label>
          <Input
            id={inputId}
            name={`section-${index}`}
            dir="auto"
            value={section.title}
            autoFocus={autoFocus}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("newExam.sections.removeNamed", {
            name:
              section.title.trim() ||
              t("newExam.sections.itemLabel", { number: index + 1 }),
          })}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <FieldError id={`${inputId}-error`} message={error} />
    </div>
  );
}
