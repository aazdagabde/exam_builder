/**
 * Moroccan school years start in August for this product convention.
 * August through December belongs to YYYY-(YYYY+1); January through July
 * belongs to (YYYY-1)-YYYY.
 */
export function getDefaultAcademicYear(date: Date): string {
  const year = date.getFullYear();
  const startsThisCalendarYear = date.getMonth() >= 7;
  const startYear = startsThisCalendarYear ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
}
