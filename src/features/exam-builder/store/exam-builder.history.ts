import type { Exam } from "@/domain/exam";

// Snapshot history is intentionally bounded while block counts remain moderate.
export const MAX_HISTORY_ENTRIES = 50;

export function appendHistorySnapshot(history: Exam[], exam: Exam): Exam[] {
  return [...history, exam].slice(-MAX_HISTORY_ENTRIES);
}
