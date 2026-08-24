import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  calculateExamPoints,
  ExamValidationCode,
  validateExam,
  type ExamValidationIssue,
} from "@/domain/exam";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

interface IssueGroup {
  issue: ExamValidationIssue;
  count: number;
}

function groupIssues(issues: ExamValidationIssue[]): IssueGroup[] {
  const groups = new Map<string, IssueGroup>();
  for (const issue of issues) {
    const key = `${issue.severity}:${issue.code}`;
    const current = groups.get(key);
    groups.set(
      key,
      current ? { ...current, count: current.count + 1 } : { issue, count: 1 },
    );
  }
  return [...groups.values()];
}

export function BuilderValidationSummary() {
  const { t } = useTranslation();
  const exam = useExamBuilderStore((state) => state.exam);
  const issues = useMemo(() => (exam ? validateExam(exam) : []), [exam]);
  const groups = useMemo(() => groupIssues(issues), [issues]);

  if (!exam || issues.length === 0) return null;
  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.length - errorCount;
  const totalMismatch = issues.some(
    (issue) => issue.code === ExamValidationCode.TOTAL_POINTS_MISMATCH,
  );
  const calculatedTotal = calculateExamPoints(exam);
  const expectedTotal = exam.metadata.totalPoints ?? 20;

  return (
    <aside
      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      aria-label={t("validation.summary.title")}
      data-print-hidden
    >
      <div className="flex items-start gap-2">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          <p className="font-medium">
            {t("validation.summary.counts", {
              errors: errorCount,
              warnings: warningCount,
            })}
          </p>
          {totalMismatch ? (
            <p data-validation-code="TOTAL_POINTS_MISMATCH">
              {t("validation.exam.totalPointsMismatchDetailed", {
                calculated: calculatedTotal,
                expected: expectedTotal,
              })}
            </p>
          ) : null}
          <details className="relative">
            <summary className="cursor-pointer font-medium underline underline-offset-2">
              {t("validation.summary.details")}
            </summary>
            <ul className="absolute end-0 top-full z-30 mt-2 w-[min(30rem,80vw)] list-disc space-y-1 rounded-md border border-amber-300 bg-amber-50 p-4 ps-8 shadow-lg">
              {groups.map(({ issue, count }) => (
                <li key={`${issue.severity}:${issue.code}`}>
                  {t(issue.messageKey)}
                  {count > 1 ? ` × ${count}` : ""}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </aside>
  );
}
