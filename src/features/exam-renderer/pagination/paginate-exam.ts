import type {
  PaginatedPage,
  PaginationUnit,
} from "@/features/exam-renderer/pagination/pagination.types";

export type PaginationMeasurements = ReadonlyMap<string, number>;

function unitHeight(
  unit: PaginationUnit,
  measurements: PaginationMeasurements,
): number {
  const measured = measurements.get(unit.id);
  return measured && measured > 0 ? measured : unit.estimatedHeight;
}

function hasSubstantiveContent(units: PaginationUnit[]): boolean {
  return units.some((unit) => unit.kind === "block");
}

function pageGroupOverhead(
  unit: PaginationUnit,
  currentPage: PaginationUnit[],
  measurements: PaginationMeasurements,
): number {
  if (unit.kind !== "block" || !unit.pageGroup) return 0;
  const alreadyStarted = currentPage.some(
    (candidate) =>
      candidate.kind === "block" &&
      candidate.pageGroup?.id === unit.pageGroup?.id,
  );
  if (alreadyStarted) return 0;
  return (
    measurements.get(unit.pageGroup.overheadMeasurementKey) ??
    unit.pageGroup.estimatedOverhead
  );
}

export function paginateUnits(
  units: PaginationUnit[],
  pageCapacity: number,
  measurements: PaginationMeasurements = new Map(),
): PaginatedPage[] {
  const capacity = pageCapacity > 0 ? pageCapacity : 1;
  const pages: PaginatedPage[] = [];
  let current: PaginationUnit[] = [];
  let usedHeight = 0;

  const flush = () => {
    if (current.length === 0) return;
    pages.push({ id: `page-${pages.length + 1}`, units: current });
    current = [];
    usedHeight = 0;
  };

  for (let index = 0; index < units.length; index += 1) {
    const unit = units[index];
    if (!unit) continue;
    if (unit.kind === "page-break") {
      if (hasSubstantiveContent(current)) flush();
      continue;
    }

    const baseHeight = unitHeight(unit, measurements);
    let height = baseHeight + pageGroupOverhead(unit, current, measurements);
    const next = units[index + 1];
    const nextHeight =
      unit.kind === "section-heading" && next && next.kind !== "page-break"
        ? unitHeight(next, measurements) +
          pageGroupOverhead(next, [unit], measurements)
        : 0;
    const keepPairTogether =
      unit.kind === "section-heading" &&
      current.length > 0 &&
      usedHeight + height + nextHeight > capacity;

    if (
      keepPairTogether ||
      (current.length > 0 && usedHeight + height > capacity)
    ) {
      flush();
      height = baseHeight + pageGroupOverhead(unit, current, measurements);
    }

    current.push(unit);
    usedHeight += height;
  }

  flush();
  return pages.length > 0 ? pages : [{ id: "page-1", units: [] }];
}
