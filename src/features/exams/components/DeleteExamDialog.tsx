import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Exam } from "@/domain/exam";

interface DeleteExamDialogProps {
  exam: Exam | null;
  isDeleting: boolean;
  onClose(): void;
  onConfirm(examId: string): Promise<boolean>;
}

export function DeleteExamDialog({
  exam,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteExamDialogProps) {
  const { t } = useTranslation();

  const confirmDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (exam) {
      await onConfirm(exam.id);
      onClose();
    }
  };

  return (
    <AlertDialog
      open={exam !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("exam.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("exam.delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              {t("exam.delete.cancel")}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => void confirmDelete(event)}
            >
              {isDeleting
                ? t("exam.delete.deleting")
                : t("exam.delete.confirm")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
