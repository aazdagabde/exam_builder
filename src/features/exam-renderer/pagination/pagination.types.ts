import type {
  DefinitionItem,
  ExamBlock,
  ExamSection,
  TableRow,
} from "@/domain/exam";

export interface WholeBlockFragment {
  kind: "whole";
}

export interface TextDocumentFragment {
  kind: "text-document";
  content: string;
  showIntroduction: boolean;
  showReferences: boolean;
  position: "single" | "start" | "middle" | "end";
}

export interface TableFragment {
  kind: "table";
  rows: TableRow[];
  showPoints: boolean;
  showQuestionNumber: boolean;
}

export interface DefinitionFragment {
  kind: "definition";
  items: DefinitionItem[];
  showInstruction: boolean;
  showBlockPoints: boolean;
}

export type BlockFragment =
  | WholeBlockFragment
  | TextDocumentFragment
  | TableFragment
  | DefinitionFragment;

export interface PaginationPageGroup {
  id: string;
  overheadMeasurementKey: string;
  estimatedOverhead: number;
}

export type PaginationUnit =
  | {
      id: string;
      kind: "header";
      estimatedHeight: number;
    }
  | {
      id: string;
      kind: "section-heading";
      section: ExamSection;
      estimatedHeight: number;
      keepWithNext: true;
    }
  | {
      id: string;
      kind: "block";
      block: ExamBlock;
      fragment: BlockFragment;
      estimatedHeight: number;
      atomic: boolean;
      pageGroup?: PaginationPageGroup;
    }
  | {
      id: string;
      kind: "page-break";
      estimatedHeight: 0;
    };

export interface PaginatedPage {
  id: string;
  units: PaginationUnit[];
}
