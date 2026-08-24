import type { Exam } from "@/domain/exam";

export function getSafeExamBaseName(exam: Exam): string {
  const title = exam.metadata.title.trim();
  const level = exam.metadata.level.trim();
  const parts = [title || "exam"];

  if (level && !title.includes(level)) parts.push(level);

  const safeName = [...parts.join(" - ")]
    .map((character) =>
      character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character)
        ? " "
        : character,
    )
    .join("")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();

  return safeName.slice(0, 120).trim() || "exam";
}
