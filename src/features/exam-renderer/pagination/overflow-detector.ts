export interface OverflowDimensions {
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

export interface OverflowResult {
  horizontal: boolean;
  vertical: boolean;
  overflowInline: number;
  overflowBlock: number;
}

export interface PageOverflowReport extends OverflowResult {
  pageNumber: number;
}

export function calculateOverflow(
  dimensions: OverflowDimensions,
  tolerance = 1,
): OverflowResult {
  const overflowInline = Math.max(
    0,
    dimensions.scrollWidth - dimensions.clientWidth,
  );
  const overflowBlock = Math.max(
    0,
    dimensions.scrollHeight - dimensions.clientHeight,
  );
  return {
    horizontal: overflowInline > tolerance,
    vertical: overflowBlock > tolerance,
    overflowInline,
    overflowBlock,
  };
}

export function inspectPageOverflows(
  root: ParentNode,
  tolerance = 1,
): PageOverflowReport[] {
  return [
    ...root.querySelectorAll<HTMLElement>(".exam-pages .exam-page__content"),
  ].map((content, index) => ({
    pageNumber: index + 1,
    ...calculateOverflow(content, tolerance),
  }));
}
