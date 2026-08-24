import { useEffect, useMemo } from "react";

import {
  computeQuestionNumbering,
  getDocumentDirection,
  type Exam,
} from "@/domain/exam";
import type { ResolvedImageAssets } from "@/features/exam-renderer/assets/renderer-assets";
import { A4Page } from "@/features/exam-renderer/components/A4Page";
import { BlockRenderer } from "@/features/exam-renderer/components/BlockRenderer";
import { ExamHeader } from "@/features/exam-renderer/components/ExamHeader";
import { SectionRenderer } from "@/features/exam-renderer/components/SectionRenderer";
import { getDocumentLabels } from "@/features/exam-renderer/document-labels";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
} from "@/features/exam-renderer/pagination/pagination.constants";
import { createPaginationUnits } from "@/features/exam-renderer/pagination/create-pagination-units";
import { mergePageUnitsForRender } from "@/features/exam-renderer/pagination/merge-page-units";
import type { PaginationUnit } from "@/features/exam-renderer/pagination/pagination.types";
import { useExamPagination } from "@/features/exam-renderer/pagination/use-exam-pagination";
import { getExamTemplate } from "@/features/exam-renderer/templates/template-registry";
import "@/features/exam-renderer/styles/exam-document.css";
import "@/features/exam-renderer/styles/print-foundation.css";

export interface ExamRendererProps {
  exam: Exam;
  assets?: ResolvedImageAssets;
  scale?: number;
  renderRevision?: number;
  formatPageLabel?(page: number, total: number): string;
  onPageCountChange?(count: number): void;
}

const EMPTY_ASSETS: ResolvedImageAssets = new Map();

function paginationUnitClassName(unit: PaginationUnit): string {
  const classes = ["exam-pagination-unit"];
  if (unit.kind === "section-heading") {
    classes.push("exam-pagination-unit--section");
  }
  if (
    unit.kind === "block" &&
    unit.fragment.kind === "text-document" &&
    unit.fragment.position !== "single"
  ) {
    classes.push(
      "exam-pagination-unit--document-fragment",
      `exam-pagination-unit--document-${unit.fragment.position}`,
    );
  }
  return classes.join(" ");
}

function RenderUnit({
  unit,
  exam,
  assets,
  onContentLoad,
  questionNumbers,
}: {
  unit: PaginationUnit;
  exam: Exam;
  assets: ResolvedImageAssets;
  onContentLoad(): void;
  questionNumbers: ReadonlyMap<string, number>;
}) {
  const labels = getDocumentLabels(exam.settings.documentLanguage);
  if (unit.kind === "header") return <ExamHeader exam={exam} labels={labels} />;
  if (unit.kind === "section-heading")
    return <SectionRenderer section={unit.section} labels={labels} />;
  if (unit.kind === "page-break") return null;
  return (
    <div
      className={`exam-block exam-block--${unit.block.type}${unit.atomic ? " exam-block--atomic" : ""}`}
      data-block-id={unit.block.id}
    >
      <BlockRenderer
        block={unit.block}
        fragment={unit.fragment}
        labels={labels}
        assets={assets}
        onContentLoad={onContentLoad}
        questionNumber={questionNumbers.get(unit.block.id)}
        showQuestionNumber={
          unit.fragment.kind === "whole" ||
          (unit.fragment.kind === "text-document" &&
            unit.fragment.showIntroduction) ||
          (unit.fragment.kind === "definition" &&
            unit.fragment.showInstruction) ||
          (unit.fragment.kind === "table" && unit.fragment.showQuestionNumber)
        }
      />
    </div>
  );
}

export function ExamRenderer({
  exam,
  assets = EMPTY_ASSETS,
  scale = 1,
  renderRevision,
  formatPageLabel,
  onPageCountChange,
}: ExamRendererProps) {
  const units = useMemo(() => createPaginationUnits(exam), [exam]);
  const questionNumbers = useMemo(() => computeQuestionNumbering(exam), [exam]);
  const assetVersion = [...assets.entries()]
    .map(
      ([id, asset]) =>
        `${id}:${asset.status}${asset.status === "ready" ? `:${asset.objectUrl}` : ""}`,
    )
    .join("|");
  const contentVersion = `${JSON.stringify(exam)}|${assetVersion}`;
  const { pages, measurementRef, scheduleMeasurement, isReady } =
    useExamPagination(units, contentVersion);
  const assetsReady = [...assets.values()].every(
    (asset) => asset.status !== "loading",
  );
  const direction = getDocumentDirection(exam.settings.documentLanguage);
  const template = getExamTemplate(exam.settings.templateId);
  const Template = template.Component;

  useEffect(
    () => onPageCountChange?.(pages.length),
    [onPageCountChange, pages.length],
  );

  return (
    <div
      className="exam-renderer"
      lang={exam.settings.documentLanguage}
      dir={direction}
      data-template-id={template.id}
      data-print-root
      data-print-ready={isReady && assetsReady ? "true" : "false"}
      data-rendered-revision={renderRevision}
      data-print-page-count={pages.length}
    >
      <Template>
        <div
          ref={measurementRef}
          className="exam-measurement"
          aria-hidden="true"
        >
          <A4Page measurement>
            {units.map((unit) =>
              unit.kind === "page-break" ? null : (
                <div
                  key={unit.id}
                  className={paginationUnitClassName(unit)}
                  data-pagination-unit-id={unit.id}
                >
                  <RenderUnit
                    unit={unit}
                    exam={exam}
                    assets={assets}
                    onContentLoad={scheduleMeasurement}
                    questionNumbers={questionNumbers}
                  />
                </div>
              ),
            )}
          </A4Page>
        </div>

        <div className="exam-pages">
          {pages.map((page, index) => (
            <div key={page.id} className="exam-preview-page-group">
              {formatPageLabel ? (
                <div className="exam-preview-page-label" data-preview-control>
                  {formatPageLabel(index + 1, pages.length)}
                </div>
              ) : null}
              <div
                className="exam-preview-page-slot"
                style={{
                  width: `${A4_WIDTH_MM * scale}mm`,
                  height: `${A4_HEIGHT_MM * scale}mm`,
                }}
              >
                <div
                  className="exam-preview-page-scale"
                  style={{ transform: `scale(${scale})` }}
                >
                  <A4Page pageNumber={index + 1}>
                    {mergePageUnitsForRender(page.units).map((unit) => (
                      <div
                        key={unit.id}
                        className={paginationUnitClassName(unit)}
                      >
                        <RenderUnit
                          unit={unit}
                          exam={exam}
                          assets={assets}
                          onContentLoad={scheduleMeasurement}
                          questionNumbers={questionNumbers}
                        />
                      </div>
                    ))}
                  </A4Page>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Template>
    </div>
  );
}
