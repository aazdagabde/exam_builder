// @vitest-environment node

import { getDefaultAcademicYear } from "@/features/exams/services/academic-year";

describe("getDefaultAcademicYear", () => {
  it.each([
    [new Date(2026, 7, 22), "2026-2027"],
    [new Date(2027, 0, 10), "2026-2027"],
    [new Date(2027, 6, 31), "2026-2027"],
    [new Date(2027, 7, 1), "2027-2028"],
  ])("maps %s to %s", (date, expectedAcademicYear) => {
    expect(getDefaultAcademicYear(date)).toBe(expectedAcademicYear);
  });
});
