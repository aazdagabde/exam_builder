import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useExamRepository } from "@/app/providers/useExamRepository";
import { ExamSchema } from "@/domain/exam";
import type {
  NewExamDraft,
  NewExamSectionDraft,
  NewExamValidationErrors,
} from "@/features/exams/models/new-exam-draft";
import { createExamFromDraft } from "@/features/exams/services/create-exam-service";
import {
  createInitialNewExamDraft,
  validateNewExamInformation,
  validateNewExamStructure,
} from "@/features/exams/services/new-exam-draft";
import { createId } from "@/lib/create-id";

export type NewExamStep = "information" | "structure";

const emptyErrors = (): NewExamValidationErrors => ({
  information: {},
  sections: {},
});

export function useNewExam() {
  const repository = useExamRepository();
  const navigate = useNavigate();
  const submissionGuard = useRef(false);
  const [step, setStep] = useState<NewExamStep>("information");
  const [draft, setDraft] = useState<NewExamDraft>(() =>
    createInitialNewExamDraft(new Date(), createId),
  );
  const [errors, setErrors] = useState<NewExamValidationErrors>(emptyErrors);
  const [saveError, setSaveError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateInformation = useCallback(
    <Field extends keyof Omit<NewExamDraft, "sections">>(
      field: Field,
      value: NewExamDraft[Field],
    ) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setSaveError(false);
      setErrors((current) => {
        const informationErrors = { ...current.information };
        delete informationErrors[field as keyof typeof informationErrors];
        return { ...current, information: informationErrors };
      });
    },
    [],
  );

  const continueToStructure = useCallback(() => {
    const informationErrors = validateNewExamInformation(draft);
    setErrors((current) => ({
      ...current,
      information: informationErrors,
    }));

    if (Object.keys(informationErrors).length > 0) {
      return false;
    }

    setStep("structure");
    return true;
  }, [draft]);

  const backToInformation = useCallback(() => {
    setStep("information");
  }, []);

  const addSection = useCallback(() => {
    const draftId = createId();
    const newSection: NewExamSectionDraft = { draftId, title: "" };
    setDraft((current) => ({
      ...current,
      sections: [...current.sections, newSection],
    }));
    setErrors((current) => ({ ...current, structure: undefined }));
    setSaveError(false);
    return draftId;
  }, []);

  const updateSection = useCallback((draftId: string, title: string) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.draftId === draftId
          ? {
              ...section,
              title,
              subject:
                section.subject === section.title ? title : section.subject,
            }
          : section,
      ),
    }));
    setErrors((current) => {
      const sectionErrors = { ...current.sections };
      delete sectionErrors[draftId];
      return { ...current, sections: sectionErrors };
    });
    setSaveError(false);
  }, []);

  const removeSection = useCallback((draftId: string) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter(
        (section) => section.draftId !== draftId,
      ),
    }));
    setErrors((current) => {
      const sectionErrors = { ...current.sections };
      delete sectionErrors[draftId];
      return { ...current, sections: sectionErrors };
    });
    setSaveError(false);
  }, []);

  const submit = useCallback(async () => {
    if (submissionGuard.current) {
      return;
    }

    const informationErrors = validateNewExamInformation(draft);
    if (Object.keys(informationErrors).length > 0) {
      setErrors((current) => ({
        ...current,
        information: informationErrors,
      }));
      setStep("information");
      return;
    }

    const structureErrors = validateNewExamStructure(draft);
    if (
      structureErrors.structure !== undefined ||
      Object.keys(structureErrors.sections).length > 0
    ) {
      setErrors((current) => ({
        ...current,
        ...structureErrors,
      }));
      return;
    }

    submissionGuard.current = true;
    setIsSubmitting(true);
    setSaveError(false);
    setErrors(emptyErrors());

    try {
      const now = new Date().toISOString();
      const exam = ExamSchema.parse(
        createExamFromDraft(draft, {
          examId: createId(),
          now,
          createSectionId: createId,
        }),
      );

      await repository.save(exam);
      navigate(`/exams/${exam.id}/edit`);
    } catch {
      setSaveError(true);
    } finally {
      submissionGuard.current = false;
      setIsSubmitting(false);
    }
  }, [draft, navigate, repository]);

  const cancel = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    step,
    draft,
    errors,
    saveError,
    isSubmitting,
    updateInformation,
    continueToStructure,
    backToInformation,
    addSection,
    updateSection,
    removeSection,
    submit,
    cancel,
  };
}
