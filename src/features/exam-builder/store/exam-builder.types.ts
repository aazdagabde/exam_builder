import type {
  BlockId,
  Exam,
  ExamBlock,
  ExamBlockType,
  ExamMetadata,
  ExamSection,
  ExamSettings,
  SectionId,
  StudentFieldsSettings,
} from "@/domain/exam";

export type BuilderStatus =
  "idle" | "loading" | "ready" | "error" | "not-found";

export type BuilderSaveStatus = "saved" | "dirty" | "saving" | "error";

export type BlockActionFailureReason =
  | "NO_ACTIVE_SECTION"
  | "BLOCK_NOT_FOUND"
  | "ESSAY_LIMIT_REACHED"
  | "IMAGE_ASSET_REQUIRED"
  | "INVALID_BLOCK";

export type BlockActionResult =
  { ok: true; id: BlockId } | { ok: false; reason: BlockActionFailureReason };

export type BlockMoveDirection = "up" | "down";

export interface BlockUpdateOptions {
  /** Consecutive updates sharing this key create a single Undo snapshot. */
  historyGroup?: string;
}

export interface ExamDetailsChanges {
  metadata?: Partial<ExamMetadata>;
  studentFields?: Partial<StudentFieldsSettings>;
  settings?: Partial<
    Pick<
      ExamSettings,
      "documentLanguage" | "showTotalPoints" | "questionNumbering"
    >
  >;
}

export interface ExamBuilderRuntime {
  createId(): string;
  now(): string;
}

export interface ExamBuilderState {
  exam: Exam | null;
  selectedSectionId: SectionId | null;
  selectedBlockId: BlockId | null;
  activeHistoryGroup: string | null;
  status: BuilderStatus;
  saveStatus: BuilderSaveStatus;
  error: string | null;
  past: Exam[];
  future: Exam[];
  revision: number;
  savedRevision: number;
}

export interface ExamBuilderActions {
  startLoading(): void;
  initialize(exam: Exam): void;
  setNotFound(): void;
  setLoadError(message: string): void;
  reset(): void;
  updateExamDetails(
    changes: ExamDetailsChanges,
    options?: BlockUpdateOptions,
  ): boolean;
  selectSection(id: SectionId): void;
  selectBlock(id: BlockId): void;
  addSection(): SectionId | null;
  setSectionTitle(id: SectionId, title: string): void;
  setSectionSubject(id: SectionId, subject: string): void;
  setSectionPoints(id: SectionId, points: number | undefined): void;
  deleteSection(id: SectionId): void;
  duplicateSection(id: SectionId): SectionId | null;
  moveSectionUp(id: SectionId): void;
  moveSectionDown(id: SectionId): void;
  reorderSections(activeId: SectionId, overId: SectionId): void;
  addBlock(type: ExamBlockType): BlockActionResult;
  addImageBlock(imageId: string): BlockActionResult;
  updateBlock(
    id: BlockId,
    updater: (block: ExamBlock) => ExamBlock,
    options?: BlockUpdateOptions,
  ): BlockActionResult;
  deleteBlock(id: BlockId): BlockActionResult;
  duplicateBlock(id: BlockId): BlockActionResult;
  moveBlock(id: BlockId, direction: BlockMoveDirection): BlockActionResult;
  reorderBlocks(activeId: BlockId, overId: BlockId): BlockActionResult;
  endHistoryGroup(key: string): void;
  undo(): void;
  redo(): void;
  startSaving(revision: number): void;
  completeSave(revision: number): void;
  failSave(revision: number): void;
}

export type ExamBuilderStore = ExamBuilderState & ExamBuilderActions;

export type SectionChanges = Partial<
  Pick<ExamSection, "title" | "subject" | "points">
>;
