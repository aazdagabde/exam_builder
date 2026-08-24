import type { PropsWithChildren } from "react";

export function A4Page({
  children,
  measurement = false,
  pageNumber,
}: PropsWithChildren<{ measurement?: boolean; pageNumber?: number }>) {
  return (
    <article
      className={`exam-page${measurement ? " exam-page--measurement" : ""}`}
      data-testid="a4-page"
      data-page-number={pageNumber}
    >
      <div className="exam-page__frame">
        <div className="exam-page__content" data-page-capacity>
          {children}
        </div>
      </div>
    </article>
  );
}
