import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { NewExamStep } from "@/features/exams/hooks/useNewExam";
import { cn } from "@/lib/utils";

const steps: Array<{ id: NewExamStep; number: number; labelKey: string }> = [
  {
    id: "information",
    number: 1,
    labelKey: "newExam.steps.information",
  },
  { id: "structure", number: 2, labelKey: "newExam.steps.structure" },
];

export function NewExamStepper({ currentStep }: { currentStep: NewExamStep }) {
  const { t } = useTranslation();
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <ol
      aria-label={t("newExam.steps.label")}
      className="grid grid-cols-2 gap-3"
    >
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isComplete = index < currentIndex;

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground",
              isCurrent && "border-primary text-foreground shadow-sm",
              isComplete && "text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold",
                (isCurrent || isComplete) &&
                  "bg-primary text-primary-foreground",
              )}
            >
              {isComplete ? (
                <Check aria-hidden="true" className="size-4" />
              ) : (
                step.number
              )}
            </span>
            <span className="font-medium">{t(step.labelKey)}</span>
          </li>
        );
      })}
    </ol>
  );
}
