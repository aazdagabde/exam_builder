import { A4_WIDTH_MM } from "@/features/exam-renderer/pagination/pagination.constants";

const CSS_PIXELS_PER_MM = 96 / 25.4;

export function calculateFitScale(containerWidth: number): number {
  const available = Math.max(1, containerWidth - 40);
  return Math.min(
    1.25,
    Math.max(0.35, available / (A4_WIDTH_MM * CSS_PIXELS_PER_MM)),
  );
}
