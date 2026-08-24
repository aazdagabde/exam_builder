import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_PAGE_CAPACITY_PX } from "@/features/exam-renderer/pagination/pagination.constants";
import { TABLE_HEADER_MEASUREMENT_PREFIX } from "@/features/exam-renderer/pagination/pagination.constants";
import { paginateUnits } from "@/features/exam-renderer/pagination/paginate-exam";
import type {
  PaginatedPage,
  PaginationUnit,
} from "@/features/exam-renderer/pagination/pagination.types";

function pageSignature(pages: PaginatedPage[]): string {
  return pages
    .map((page) => page.units.map((unit) => unit.id).join(","))
    .join("|");
}

export function useExamPagination(
  units: PaginationUnit[],
  contentVersion: string,
) {
  const measurementRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unitsKey = `${contentVersion}|${units.map((unit) => unit.id).join("|")}`;
  const estimatedPages = useMemo(
    () => paginateUnits(units, DEFAULT_PAGE_CAPACITY_PX),
    [units],
  );
  const [pagination, setPagination] = useState<{
    key: string;
    pages: PaginatedPage[];
  }>(() => ({ key: unitsKey, pages: estimatedPages }));
  const [measuredKey, setMeasuredKey] = useState<string | null>(null);

  const measure = useCallback(() => {
    const root = measurementRef.current;
    if (!root) return;
    const capacityElement = root.querySelector<HTMLElement>(
      "[data-page-capacity]",
    );
    const measuredCapacity =
      capacityElement?.getBoundingClientRect().height ?? 0;
    const capacity =
      measuredCapacity > 0 ? measuredCapacity : DEFAULT_PAGE_CAPACITY_PX;
    const measurements = new Map<string, number>();
    for (const element of root.querySelectorAll<HTMLElement>(
      "[data-pagination-unit-id]",
    )) {
      const id = element.dataset.paginationUnitId;
      let height = element.getBoundingClientRect().height;
      const table = element.querySelector<HTMLElement>("[data-table-block-id]");
      const tableHeader = table?.querySelector<HTMLElement>("thead");
      const tableId = table?.dataset.tableBlockId;
      if (tableHeader && tableId) {
        const headerHeight = tableHeader.getBoundingClientRect().height;
        if (headerHeight > 0) {
          height = Math.max(1, height - headerHeight);
          measurements.set(
            `${TABLE_HEADER_MEASUREMENT_PREFIX}${tableId}`,
            headerHeight,
          );
        }
      }
      if (id && height > 0) measurements.set(id, height);
    }
    const nextPages = paginateUnits(units, capacity, measurements);
    setPagination((current) => {
      if (
        current.key === unitsKey &&
        pageSignature(current.pages) === pageSignature(nextPages)
      ) {
        return current;
      }
      return { key: unitsKey, pages: nextPages };
    });
    setMeasuredKey(unitsKey);
  }, [units, unitsKey]);

  const scheduleMeasurement = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setMeasuredKey((current) => (current === unitsKey ? null : current));
    timerRef.current = setTimeout(measure, 80);
  }, [measure, unitsKey]);

  useLayoutEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(measure, 80);
    const root = measurementRef.current;
    const observer =
      root && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleMeasurement)
        : null;
    if (root) observer?.observe(root);
    void document.fonts?.ready.then(scheduleMeasurement);
    return () => {
      observer?.disconnect();
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [contentVersion, measure, scheduleMeasurement, units]);

  const pages = pagination.key === unitsKey ? pagination.pages : estimatedPages;
  const isReady = pagination.key === unitsKey && measuredKey === unitsKey;
  return { pages, measurementRef, scheduleMeasurement, isReady };
}
