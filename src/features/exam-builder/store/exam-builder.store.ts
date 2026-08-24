import { createStore, type StoreApi } from "zustand/vanilla";

import {
  countEssayBlocks,
  createExamBlock,
  createImageBlock,
  duplicateBlock as duplicateDomainBlock,
  duplicateSection as duplicateDomainSection,
  ExamBlockSchema,
  ExamSchema,
  MAX_ESSAY_BLOCKS_PER_EXAM,
  normalizeBlockOrder,
  type BlockId,
  type Exam,
  type ExamBlock,
  type ExamSection,
  type ImageBlock,
  type SectionId,
} from "@/domain/exam";
import {
  appendHistorySnapshot,
  MAX_HISTORY_ENTRIES,
} from "@/features/exam-builder/store/exam-builder.history";
import type {
  BlockActionResult,
  BlockMoveDirection,
  BlockUpdateOptions,
  ExamBuilderRuntime,
  ExamBuilderState,
  ExamBuilderStore,
  SectionChanges,
} from "@/features/exam-builder/store/exam-builder.types";
import { createId } from "@/lib/create-id";

const browserRuntime: ExamBuilderRuntime = {
  createId,
  now: () => new Date().toISOString(),
};

interface BuilderSelection {
  sectionId: SectionId | null;
  blockId: BlockId | null;
}

interface CommitOptions {
  historyGroup?: string;
  select?(exam: Exam, previousExam: Exam): BuilderSelection;
}

const initialState = (): ExamBuilderState => ({
  exam: null,
  selectedSectionId: null,
  selectedBlockId: null,
  activeHistoryGroup: null,
  status: "idle",
  saveStatus: "saved",
  error: null,
  past: [],
  future: [],
  revision: 0,
  savedRevision: 0,
});

function selectionForSection(
  exam: Exam,
  sectionId: SectionId | null,
): BuilderSelection {
  const section = exam.sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    const first = exam.sections[0];
    return {
      sectionId: first?.id ?? null,
      blockId: first?.blocks[0]?.id ?? null,
    };
  }
  return { sectionId: section.id, blockId: section.blocks[0]?.id ?? null };
}

function repairSelection(
  exam: Exam,
  preferredSectionId: SectionId | null,
  preferredBlockId: BlockId | null,
): BuilderSelection {
  const section = exam.sections.find(
    (candidate) => candidate.id === preferredSectionId,
  );
  if (!section) return selectionForSection(exam, null);

  const blockId = section.blocks.some((block) => block.id === preferredBlockId)
    ? preferredBlockId
    : (section.blocks[0]?.id ?? null);
  return { sectionId: section.id, blockId };
}

function normalizeExamBlockOrders(exam: Exam): Exam {
  let changed = false;
  const sections = exam.sections.map((section) => {
    const blocks = normalizeBlockOrder(section.blocks);
    if (blocks.some((block, index) => block !== section.blocks[index])) {
      changed = true;
      return { ...section, blocks };
    }
    return section;
  });
  return changed ? { ...exam, sections } : exam;
}

function failed(
  reason: Extract<BlockActionResult, { ok: false }>["reason"],
): BlockActionResult {
  return { ok: false, reason };
}

export function createExamBuilderStore(
  runtime: ExamBuilderRuntime = browserRuntime,
): StoreApi<ExamBuilderStore> {
  return createStore<ExamBuilderStore>()((set, get) => {
    const commit = (
      update: (exam: Exam) => Exam,
      options: CommitOptions = {},
    ): boolean => {
      let committed = false;
      set((state) => {
        if (state.exam === null || state.status !== "ready") return state;

        const updatedExam = update(state.exam);
        if (updatedExam === state.exam) return state;

        committed = true;
        const exam = { ...updatedExam, updatedAt: runtime.now() };
        const selection = options.select
          ? options.select(exam, state.exam)
          : repairSelection(
              exam,
              state.selectedSectionId,
              state.selectedBlockId,
            );
        const continuesHistoryGroup =
          options.historyGroup !== undefined &&
          state.activeHistoryGroup === options.historyGroup;

        return {
          ...state,
          exam,
          selectedSectionId: selection.sectionId,
          selectedBlockId: selection.blockId,
          activeHistoryGroup: options.historyGroup ?? null,
          past: continuesHistoryGroup
            ? state.past
            : appendHistorySnapshot(state.past, state.exam),
          future: [],
          revision: state.revision + 1,
          saveStatus: "dirty",
        };
      });
      return committed;
    };

    const updateSection = (id: SectionId, changes: SectionChanges) => {
      commit((exam) => {
        const sectionIndex = exam.sections.findIndex(
          (section) => section.id === id,
        );
        if (sectionIndex < 0) return exam;

        const current = exam.sections[sectionIndex]!;
        const updated = { ...current, ...changes };
        if (
          updated.title === current.title &&
          updated.subject === current.subject &&
          updated.points === current.points
        ) {
          return exam;
        }

        const sections = [...exam.sections];
        sections[sectionIndex] = updated;
        return { ...exam, sections };
      });
    };

    const moveSection = (id: SectionId, offset: -1 | 1) => {
      commit((exam) => {
        const index = exam.sections.findIndex((section) => section.id === id);
        const destination = index + offset;
        if (
          index < 0 ||
          destination < 0 ||
          destination >= exam.sections.length
        ) {
          return exam;
        }

        const sections = [...exam.sections];
        const [section] = sections.splice(index, 1);
        sections.splice(destination, 0, section!);
        return { ...exam, sections };
      });
    };

    const reorderBlocks = (
      activeId: BlockId,
      overId: BlockId,
    ): BlockActionResult => {
      const state = get();
      const section = state.exam?.sections.find(
        (candidate) => candidate.id === state.selectedSectionId,
      );
      if (!section) return failed("NO_ACTIVE_SECTION");

      const activeIndex = section.blocks.findIndex(
        (block) => block.id === activeId,
      );
      const overIndex = section.blocks.findIndex(
        (block) => block.id === overId,
      );
      if (activeIndex < 0 || overIndex < 0) return failed("BLOCK_NOT_FOUND");
      if (activeIndex === overIndex) return { ok: true, id: activeId };

      commit((exam) => {
        const sectionIndex = exam.sections.findIndex(
          (candidate) => candidate.id === section.id,
        );
        if (sectionIndex < 0) return exam;
        const currentSection = exam.sections[sectionIndex]!;
        const blocks = [...currentSection.blocks];
        const [active] = blocks.splice(activeIndex, 1);
        blocks.splice(overIndex, 0, active!);
        const sections = [...exam.sections];
        sections[sectionIndex] = {
          ...currentSection,
          blocks: normalizeBlockOrder(blocks),
        };
        return { ...exam, sections };
      });
      return { ok: true, id: activeId };
    };

    return {
      ...initialState(),

      startLoading: () => set({ ...initialState(), status: "loading" }),

      initialize: (sourceExam) => {
        const exam = normalizeExamBlockOrders(sourceExam);
        const selection = selectionForSection(
          exam,
          exam.sections[0]?.id ?? null,
        );
        set({
          ...initialState(),
          exam,
          selectedSectionId: selection.sectionId,
          selectedBlockId: selection.blockId,
          status: "ready",
        });
      },

      setNotFound: () => set({ ...initialState(), status: "not-found" }),

      setLoadError: (message) =>
        set({ ...initialState(), status: "error", error: message }),

      reset: () => set(initialState()),

      updateExamDetails: (changes, options = {}) =>
        commit(
          (exam) => {
            const updated: Exam = {
              ...exam,
              metadata: changes.metadata
                ? { ...exam.metadata, ...changes.metadata }
                : exam.metadata,
              studentFields: changes.studentFields
                ? { ...exam.studentFields, ...changes.studentFields }
                : exam.studentFields,
              settings: changes.settings
                ? { ...exam.settings, ...changes.settings }
                : exam.settings,
            };

            if (!ExamSchema.safeParse(updated).success) return exam;
            return updated;
          },
          { historyGroup: options.historyGroup },
        ),

      selectSection: (id) => {
        const exam = get().exam;
        if (!exam?.sections.some((section) => section.id === id)) return;
        const selection = selectionForSection(exam, id);
        set({
          selectedSectionId: selection.sectionId,
          selectedBlockId: selection.blockId,
          activeHistoryGroup: null,
        });
      },

      selectBlock: (id) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (section?.blocks.some((block) => block.id === id)) {
          set({ selectedBlockId: id, activeHistoryGroup: null });
        }
      },

      addSection: () => {
        if (get().exam === null) return null;
        const id = runtime.createId();
        const section: ExamSection = { id, title: "", blocks: [] };
        const committed = commit(
          (exam) => ({ ...exam, sections: [...exam.sections, section] }),
          { select: () => ({ sectionId: id, blockId: null }) },
        );
        return committed ? id : null;
      },

      setSectionTitle: (id, title) => updateSection(id, { title }),

      setSectionSubject: (id, subject) =>
        updateSection(id, { subject: subject === "" ? undefined : subject }),

      setSectionPoints: (id, points) => {
        if (points !== undefined && (!Number.isFinite(points) || points < 0)) {
          return;
        }
        updateSection(id, { points });
      },

      deleteSection: (id) => {
        const state = get();
        const oldIndex = state.exam?.sections.findIndex(
          (section) => section.id === id,
        );
        if (oldIndex === undefined || oldIndex < 0) return;
        const selectedSectionId = state.selectedSectionId;
        commit(
          (exam) => ({
            ...exam,
            sections: exam.sections.filter((section) => section.id !== id),
          }),
          {
            select: (exam) => {
              if (selectedSectionId !== id) {
                return repairSelection(
                  exam,
                  selectedSectionId,
                  state.selectedBlockId,
                );
              }
              const section = exam.sections[oldIndex] ?? exam.sections.at(-1);
              return {
                sectionId: section?.id ?? null,
                blockId: section?.blocks[0]?.id ?? null,
              };
            },
          },
        );
      },

      duplicateSection: (id) => {
        const exam = get().exam;
        const source = exam?.sections.find((section) => section.id === id);
        if (!exam || !source) return null;
        if (
          source.blocks.some((block) => block.type === "essay") &&
          countEssayBlocks(exam) >= MAX_ESSAY_BLOCKS_PER_EXAM
        ) {
          return null;
        }

        const duplicateId = runtime.createId();
        const duplicate = duplicateDomainSection(source, {
          id: duplicateId,
          createInternalId: () => runtime.createId(),
        });
        const committed = commit(
          (exam) => {
            const index = exam.sections.findIndex(
              (section) => section.id === id,
            );
            if (index < 0) return exam;
            const sections = [...exam.sections];
            sections.splice(index + 1, 0, duplicate);
            return { ...exam, sections };
          },
          {
            select: () => ({
              sectionId: duplicateId,
              blockId: duplicate.blocks[0]?.id ?? null,
            }),
          },
        );
        return committed ? duplicateId : null;
      },

      moveSectionUp: (id) => moveSection(id, -1),
      moveSectionDown: (id) => moveSection(id, 1),
      reorderSections: (activeId, overId) => {
        if (activeId === overId) return;
        commit((exam) => {
          const activeIndex = exam.sections.findIndex(
            (section) => section.id === activeId,
          );
          const overIndex = exam.sections.findIndex(
            (section) => section.id === overId,
          );
          if (activeIndex < 0 || overIndex < 0) return exam;
          const sections = [...exam.sections];
          const [active] = sections.splice(activeIndex, 1);
          sections.splice(overIndex, 0, active!);
          return { ...exam, sections };
        });
      },

      addBlock: (type) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (!state.exam || !section) return failed("NO_ACTIVE_SECTION");
        if (type === "image") return failed("IMAGE_ASSET_REQUIRED");
        if (
          type === "essay" &&
          countEssayBlocks(state.exam) >= MAX_ESSAY_BLOCKS_PER_EXAM
        ) {
          return failed("ESSAY_LIMIT_REACHED");
        }

        const id = runtime.createId();
        const block = createExamBlock({
          type,
          id,
          order: section.blocks.length,
          createInternalId: () => runtime.createId(),
        });
        const committed = commit(
          (exam) => {
            const sectionIndex = exam.sections.findIndex(
              (candidate) => candidate.id === section.id,
            );
            if (sectionIndex < 0) return exam;
            const current = exam.sections[sectionIndex]!;
            const sections = [...exam.sections];
            sections[sectionIndex] = {
              ...current,
              blocks: normalizeBlockOrder([...current.blocks, block]),
            };
            return { ...exam, sections };
          },
          { select: () => ({ sectionId: section.id, blockId: id }) },
        );
        return committed ? { ok: true, id } : failed("NO_ACTIVE_SECTION");
      },

      addImageBlock: (imageId) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (!state.exam || !section) return failed("NO_ACTIVE_SECTION");

        const id = runtime.createId();
        let block: ImageBlock;
        try {
          block = createImageBlock({
            id,
            order: section.blocks.length,
            imageId,
          });
        } catch {
          return failed("IMAGE_ASSET_REQUIRED");
        }
        const committed = commit(
          (exam) => {
            const sectionIndex = exam.sections.findIndex(
              (candidate) => candidate.id === section.id,
            );
            if (sectionIndex < 0) return exam;
            const current = exam.sections[sectionIndex]!;
            const sections = [...exam.sections];
            sections[sectionIndex] = {
              ...current,
              blocks: normalizeBlockOrder([...current.blocks, block]),
            };
            return { ...exam, sections };
          },
          { select: () => ({ sectionId: section.id, blockId: id }) },
        );
        return committed ? { ok: true, id } : failed("NO_ACTIVE_SECTION");
      },

      updateBlock: (id, updater, options: BlockUpdateOptions = {}) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (!section) return failed("NO_ACTIVE_SECTION");
        const source = section.blocks.find((block) => block.id === id);
        if (!source) return failed("BLOCK_NOT_FOUND");

        let updated: ExamBlock;
        try {
          updated = updater(source);
        } catch {
          return failed("INVALID_BLOCK");
        }
        if (updated === source) return { ok: true, id };
        if (updated.id !== source.id || updated.type !== source.type) {
          return failed("INVALID_BLOCK");
        }
        if (!ExamBlockSchema.safeParse(updated).success) {
          return failed("INVALID_BLOCK");
        }

        const committed = commit(
          (exam) => {
            const sectionIndex = exam.sections.findIndex(
              (candidate) => candidate.id === section.id,
            );
            if (sectionIndex < 0) return exam;
            const currentSection = exam.sections[sectionIndex]!;
            const blockIndex = currentSection.blocks.findIndex(
              (block) => block.id === id,
            );
            if (blockIndex < 0) return exam;
            const blocks = [...currentSection.blocks];
            blocks[blockIndex] = updated;
            const sections = [...exam.sections];
            sections[sectionIndex] = { ...currentSection, blocks };
            return { ...exam, sections };
          },
          { historyGroup: options.historyGroup },
        );
        return committed ? { ok: true, id } : failed("BLOCK_NOT_FOUND");
      },

      deleteBlock: (id) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (!section) return failed("NO_ACTIVE_SECTION");
        const index = section.blocks.findIndex((block) => block.id === id);
        if (index < 0) return failed("BLOCK_NOT_FOUND");
        const nextSelectedId =
          state.selectedBlockId === id
            ? (section.blocks[index + 1]?.id ??
              section.blocks[index - 1]?.id ??
              null)
            : state.selectedBlockId;

        commit(
          (exam) => {
            const sectionIndex = exam.sections.findIndex(
              (candidate) => candidate.id === section.id,
            );
            if (sectionIndex < 0) return exam;
            const current = exam.sections[sectionIndex]!;
            const sections = [...exam.sections];
            sections[sectionIndex] = {
              ...current,
              blocks: normalizeBlockOrder(
                current.blocks.filter((block) => block.id !== id),
              ),
            };
            return { ...exam, sections };
          },
          {
            select: (exam) => repairSelection(exam, section.id, nextSelectedId),
          },
        );
        return { ok: true, id };
      },

      duplicateBlock: (id) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (!section) return failed("NO_ACTIVE_SECTION");
        const sourceIndex = section.blocks.findIndex(
          (block) => block.id === id,
        );
        if (sourceIndex < 0) return failed("BLOCK_NOT_FOUND");
        const source = section.blocks[sourceIndex]!;
        if (source.type === "essay") return failed("ESSAY_LIMIT_REACHED");

        const duplicateId = runtime.createId();
        const duplicate = duplicateDomainBlock(source, {
          id: duplicateId,
          createInternalId: () => runtime.createId(),
        });
        commit(
          (exam) => {
            const sectionIndex = exam.sections.findIndex(
              (candidate) => candidate.id === section.id,
            );
            if (sectionIndex < 0) return exam;
            const current = exam.sections[sectionIndex]!;
            const blocks = [...current.blocks];
            const currentSourceIndex = blocks.findIndex(
              (block) => block.id === id,
            );
            if (currentSourceIndex < 0) return exam;
            blocks.splice(currentSourceIndex + 1, 0, duplicate);
            const sections = [...exam.sections];
            sections[sectionIndex] = {
              ...current,
              blocks: normalizeBlockOrder(blocks),
            };
            return { ...exam, sections };
          },
          {
            select: () => ({ sectionId: section.id, blockId: duplicateId }),
          },
        );
        return { ok: true, id: duplicateId };
      },

      moveBlock: (id: BlockId, direction: BlockMoveDirection) => {
        const state = get();
        const section = state.exam?.sections.find(
          (candidate) => candidate.id === state.selectedSectionId,
        );
        if (!section) return failed("NO_ACTIVE_SECTION");
        const index = section.blocks.findIndex((block) => block.id === id);
        if (index < 0) return failed("BLOCK_NOT_FOUND");
        const destination = direction === "up" ? index - 1 : index + 1;
        const over = section.blocks[destination];
        if (!over) return { ok: true, id };
        return reorderBlocks(id, over.id);
      },

      reorderBlocks,

      endHistoryGroup: (key) => {
        if (get().activeHistoryGroup === key) {
          set({ activeHistoryGroup: null });
        }
      },

      undo: () => {
        set((state) => {
          const previous = state.past.at(-1);
          if (!state.exam || !previous) return state;
          const exam = {
            ...normalizeExamBlockOrders(previous),
            updatedAt: runtime.now(),
          };
          const selection = repairSelection(
            exam,
            state.selectedSectionId,
            state.selectedBlockId,
          );
          return {
            ...state,
            exam,
            selectedSectionId: selection.sectionId,
            selectedBlockId: selection.blockId,
            activeHistoryGroup: null,
            past: state.past.slice(0, -1),
            future: [state.exam, ...state.future].slice(0, MAX_HISTORY_ENTRIES),
            revision: state.revision + 1,
            saveStatus: "dirty",
          };
        });
      },

      redo: () => {
        set((state) => {
          const next = state.future[0];
          if (!state.exam || !next) return state;
          const exam = {
            ...normalizeExamBlockOrders(next),
            updatedAt: runtime.now(),
          };
          const selection = repairSelection(
            exam,
            state.selectedSectionId,
            state.selectedBlockId,
          );
          return {
            ...state,
            exam,
            selectedSectionId: selection.sectionId,
            selectedBlockId: selection.blockId,
            activeHistoryGroup: null,
            past: appendHistorySnapshot(state.past, state.exam),
            future: state.future.slice(1),
            revision: state.revision + 1,
            saveStatus: "dirty",
          };
        });
      },

      startSaving: (revision) => {
        if (get().revision === revision) set({ saveStatus: "saving" });
      },

      completeSave: (revision) =>
        set((state) => {
          const savedRevision = Math.max(state.savedRevision, revision);
          return {
            savedRevision,
            saveStatus: state.revision <= savedRevision ? "saved" : "dirty",
          };
        }),

      failSave: (revision) =>
        set((state) => ({
          saveStatus: state.revision === revision ? "error" : "dirty",
        })),
    };
  });
}
