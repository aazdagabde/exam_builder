import { useTranslation } from "react-i18next";

import { PageHeader } from "@/app/components/PageHeader";
import { ExamInformationStep } from "@/features/exams/components/new-exam/ExamInformationStep";
import { ExamStructureStep } from "@/features/exams/components/new-exam/ExamStructureStep";
import { NewExamStepper } from "@/features/exams/components/new-exam/NewExamStepper";
import { useNewExam } from "@/features/exams/hooks/useNewExam";

export function NewExamPage() {
  const { t } = useTranslation();
  const newExam = useNewExam();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={t("newExam.title")}
        description={t("newExam.description")}
      />

      <NewExamStepper currentStep={newExam.step} />

      {newExam.saveError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {t("newExam.error.save")}
        </div>
      ) : null}

      {newExam.step === "information" ? (
        <ExamInformationStep
          draft={newExam.draft}
          errors={newExam.errors.information}
          onUpdate={newExam.updateInformation}
          onContinue={newExam.continueToStructure}
          onCancel={newExam.cancel}
        />
      ) : (
        <ExamStructureStep
          sections={newExam.draft.sections}
          errors={{
            sections: newExam.errors.sections,
            structure: newExam.errors.structure,
          }}
          isSubmitting={newExam.isSubmitting}
          onAdd={newExam.addSection}
          onUpdate={newExam.updateSection}
          onRemove={newExam.removeSection}
          onBack={newExam.backToInformation}
          onSubmit={newExam.submit}
        />
      )}
    </div>
  );
}
