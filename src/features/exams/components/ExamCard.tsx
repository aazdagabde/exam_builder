import {
  BookOpen,
  CalendarDays,
  Copy,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Exam } from "@/domain/exam";
import { formatExamUpdatedAt } from "@/features/exams/services/exam-formatters";
import { ExportProjectMenuItem } from "@/features/project-backup/components/ExportProjectMenuItem";
import { useExportProjectBackup } from "@/features/project-backup/hooks/useExportProjectBackup";

interface ExamCardProps {
  exam: Exam;
  isDuplicating: boolean;
  onDuplicate(examId: string): void;
  onDelete(exam: Exam): void;
}

export function ExamCard({
  exam,
  isDuplicating,
  onDuplicate,
  onDelete,
}: ExamCardProps) {
  const { t, i18n } = useTranslation();
  const projectExport = useExportProjectBackup(exam);
  const title = exam.metadata.title.trim() || t("exam.untitled");
  const level = exam.metadata.level.trim() || t("exam.unknownLevel");
  const subject = exam.metadata.subject.trim() || t("exam.unknownSubject");
  const updatedAt = formatExamUpdatedAt(
    exam.updatedAt,
    i18n.resolvedLanguage ?? i18n.language,
  );

  return (
    <Card className="h-full gap-5" data-exam-id={exam.id}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <CardTitle>
              <span
                lang={exam.settings.documentLanguage}
                dir="auto"
                className="line-clamp-2"
              >
                {title}
              </span>
            </CardTitle>
            {exam.metadata.examNumber || exam.metadata.academicYear ? (
              <CardDescription className="flex flex-wrap gap-x-3 gap-y-1">
                {exam.metadata.examNumber ? (
                  <span dir="auto">
                    {t("exam.number", { number: exam.metadata.examNumber })}
                  </span>
                ) : null}
                {exam.metadata.academicYear ? (
                  <span dir="auto">{exam.metadata.academicYear}</span>
                ) : null}
              </CardDescription>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("exam.actions.more", { title })}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ExportProjectMenuItem
                isPreparing={projectExport.state.status === "preparing"}
                onExport={() => void projectExport.exportProject()}
              />
              <DropdownMenuItem
                disabled={isDuplicating}
                onSelect={() => onDuplicate(exam.id)}
              >
                <Copy aria-hidden="true" />
                {isDuplicating
                  ? t("exam.actions.duplicating")
                  : t("exam.actions.duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(exam)}
              >
                <Trash2 aria-hidden="true" />
                {t("exam.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {projectExport.state.status === "preparing" ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("projectBackup.export.preparing")}
          </p>
        ) : null}
        {projectExport.state.status === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`projectBackup.errors.${projectExport.state.code}`)}
          </p>
        ) : null}
        <dl className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <GraduationCap
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <dt className="sr-only">{t("exam.level")}</dt>
            <dd dir="auto" className="truncate">
              {level}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <dt className="sr-only">{t("exam.subject")}</dt>
            <dd dir="auto" className="truncate">
              {subject}
            </dd>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <CalendarDays aria-hidden="true" className="mt-0.5 size-4" />
            <dt>{t("exam.lastModified")}</dt>
            <dd>{updatedAt}</dd>
          </div>
        </dl>

        <Button asChild className="mt-auto w-full sm:w-auto sm:self-start">
          <Link to={`/exams/${exam.id}/edit`}>
            <Pencil aria-hidden="true" />
            {t("exam.actions.edit")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
