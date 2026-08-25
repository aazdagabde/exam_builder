export type BlockId = string;
export type DefinitionItemId = string;
export type StatementId = string;
export type OptionId = string;
export type FillBlankId = string;
export type TableColumnId = string;
export type TableRowId = string;
export type MatchingItemId = string;
export type EssayTopicId = string;
export type TimelineEventId = string;
export type ChartCategoryId = string;
export type ChartSeriesId = string;

export type ExamBlockType =
  | "instruction"
  | "text-document"
  | "image"
  | "question"
  | "definition"
  | "true-false"
  | "multiple-choice"
  | "fill-blank"
  | "table"
  | "matching"
  | "timeline"
  | "chart"
  | "essay"
  | "free-text"
  | "separator"
  | "page-break";

export interface BaseBlock {
  id: BlockId;
  type: ExamBlockType;
  order: number;
  points?: number;
  /** Whether this pedagogical element starts a numbered question. */
  startsNewQuestion: boolean;
}

export interface InstructionBlock extends BaseBlock {
  type: "instruction";
  content: string;
}

export interface TextDocumentBlock extends BaseBlock {
  type: "text-document";
  instruction?: string;
  title?: string;
  content: string;
  source?: string;
  reference?: string;
  bordered?: boolean;
}

export type ImageAlignment = "start" | "center" | "end";

export interface ImageBlock extends BaseBlock {
  type: "image";
  /** The binary resource is stored separately by the future persistence layer. */
  imageId: string;
  title?: string;
  caption?: string;
  source?: string;
  width?: number;
  alignment?: ImageAlignment;
  bordered?: boolean;
}

export type QuestionAnswerMode = "none" | "lines" | "box";

export interface QuestionBlock extends BaseBlock {
  type: "question";
  question: string;
  answerMode: QuestionAnswerMode;
  answerLines?: number;
}

export interface DefinitionItem {
  id: DefinitionItemId;
  term: string;
  answerLines: number;
  points?: number;
}

export interface DefinitionBlock extends BaseBlock {
  type: "definition";
  instruction?: string;
  items: DefinitionItem[];
}

export interface TrueFalseStatement {
  id: StatementId;
  text: string;
  points?: number;
}

export interface TrueFalseBlock extends BaseBlock {
  type: "true-false";
  instruction?: string;
  statements: TrueFalseStatement[];
}

export interface MultipleChoiceOption {
  id: OptionId;
  text: string;
}

export interface MultipleChoiceBlock extends BaseBlock {
  type: "multiple-choice";
  question: string;
  options: MultipleChoiceOption[];
  allowMultipleAnswers?: boolean;
}

export interface FillBlankTextSegment {
  type: "text";
  value: string;
}

export interface FillBlankBlankSegment {
  type: "blank";
  id: FillBlankId;
  width?: number;
}

export type FillBlankSegment = FillBlankTextSegment | FillBlankBlankSegment;

export interface FillBlankBlock extends BaseBlock {
  type: "fill-blank";
  instruction?: string;
  segments: FillBlankSegment[];
}

export interface TableColumn {
  id: TableColumnId;
  label: string;
}

export interface TableCell {
  columnId: TableColumnId;
  value?: string;
}

export interface TableRow {
  id: TableRowId;
  cells: TableCell[];
}

export interface TableBlock extends BaseBlock {
  type: "table";
  columns: TableColumn[];
  rows: TableRow[];
  showHeader: boolean;
}

export interface MatchingItem {
  id: MatchingItemId;
  text: string;
}

export interface MatchingBlock extends BaseBlock {
  type: "matching";
  instruction?: string;
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  shuffleRight?: boolean;
}

export interface TimelineEvent {
  id: TimelineEventId;
  date: string;
  label: string;
  description?: string;
}

export type TimelineOrientation = "horizontal" | "vertical";

export interface TimelineBlock extends BaseBlock {
  type: "timeline";
  title?: string;
  events: TimelineEvent[];
  orientation: TimelineOrientation;
  showDates: boolean;
}

export type ChartType = "bar" | "line" | "pie";

export interface ChartCategory {
  id: ChartCategoryId;
  label: string;
}

export interface ChartSeries {
  id: ChartSeriesId;
  name: string;
  values: Array<number | null>;
}

export interface ChartBlock extends BaseBlock {
  type: "chart";
  title?: string;
  chartType: ChartType;
  labels: ChartCategory[];
  series: ChartSeries[];
  showLegend: boolean;
  showValues: boolean;
  yAxisLabel?: string;
}

export interface EssayTopic {
  id: EssayTopicId;
  text: string;
}

export interface EssayBlock extends BaseBlock {
  type: "essay";
  context?: string;
  instruction: string;
  topics: EssayTopic[];
}

export type FreeTextVariant = "paragraph" | "note" | "subtitle";

export interface FreeTextBlock extends BaseBlock {
  type: "free-text";
  content: string;
  variant?: FreeTextVariant;
}

export type SeparatorStyle = "line" | "space";

export interface SeparatorBlock extends BaseBlock {
  type: "separator";
  startsNewQuestion: false;
  style?: SeparatorStyle;
}

export interface PageBreakBlock extends BaseBlock {
  type: "page-break";
  startsNewQuestion: false;
}

export type ExamBlock =
  | InstructionBlock
  | TextDocumentBlock
  | ImageBlock
  | QuestionBlock
  | DefinitionBlock
  | TrueFalseBlock
  | MultipleChoiceBlock
  | FillBlankBlock
  | TableBlock
  | MatchingBlock
  | TimelineBlock
  | ChartBlock
  | EssayBlock
  | FreeTextBlock
  | SeparatorBlock
  | PageBreakBlock;
