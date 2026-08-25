// @vitest-environment node

import { addChartCategory } from "@/domain/exam";
import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { MAX_HISTORY_ENTRIES } from "@/features/exam-builder/store/exam-builder.history";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";

function createRuntime() {
  let id = 0;
  let tick = 0;
  return {
    createId: () => `generated-${++id}`,
    now: () => `2026-08-23T10:00:${String(++tick).padStart(2, "0")}.000Z`,
  };
}

function createThreeSectionExam() {
  return createTestExam([
    createTestSection([], { id: "a", title: "A" }),
    createTestSection([], { id: "b", title: "B" }),
    createTestSection([], { id: "c", title: "C" }),
  ]);
}

describe("Exam Builder store", () => {
  it("initializes ready with the first section selected and clean history", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    expect(store.getState()).toMatchObject({
      status: "ready",
      selectedSectionId: "a",
      saveStatus: "saved",
      revision: 0,
      savedRevision: 0,
      past: [],
      future: [],
    });
  });

  it("selects a section without creating history", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    store.getState().selectSection("c");

    expect(store.getState().selectedSectionId).toBe("c");
    expect(store.getState().past).toEqual([]);
    expect(store.getState().revision).toBe(0);
  });

  it("updates document settings with history and keeps interface language independent", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    const changed = store.getState().updateExamDetails({
      metadata: { title: "Updated", totalPoints: 18 },
      studentFields: { showStudentNumber: false },
      settings: { documentLanguage: "fr", showTotalPoints: false },
    });

    expect(changed).toBe(true);
    expect(store.getState().exam).toMatchObject({
      metadata: { title: "Updated", totalPoints: 18 },
      studentFields: { showStudentNumber: false },
      settings: { documentLanguage: "fr", showTotalPoints: false },
    });
    expect(store.getState()).toMatchObject({
      revision: 1,
      saveStatus: "dirty",
    });
    expect(store.getState().past).toHaveLength(1);

    store.getState().undo();
    expect(store.getState().exam?.metadata.title).not.toBe("Updated");
  });

  it("adds and selects an empty dirty section with history", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    const id = store.getState().addSection();

    expect(id).toBe("generated-1");
    expect(store.getState().exam?.sections.at(-1)).toMatchObject({
      id,
      title: "",
      blocks: [],
    });
    expect(store.getState()).toMatchObject({
      selectedSectionId: id,
      saveStatus: "dirty",
      revision: 1,
    });
    expect(store.getState().past).toHaveLength(1);
  });

  it("edits title, subject, and points and restores title through undo/redo", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    store.getState().setSectionTitle("a", "History");
    store.getState().setSectionSubject("a", "Social studies");
    store.getState().setSectionPoints("a", 7);
    expect(store.getState().exam?.sections[0]).toMatchObject({
      title: "History",
      subject: "Social studies",
      points: 7,
    });

    store.getState().undo();
    expect(store.getState().exam?.sections[0]?.points).toBeUndefined();
    store.getState().undo();
    expect(store.getState().exam?.sections[0]?.subject).toBeUndefined();
    store.getState().undo();
    expect(store.getState().exam?.sections[0]?.title).toBe("A");
    store.getState().redo();
    expect(store.getState().exam?.sections[0]?.title).toBe("History");
  });

  it("selects the next section, then previous, when deleting the active one", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());
    store.getState().selectSection("b");

    store.getState().deleteSection("b");
    expect(store.getState().selectedSectionId).toBe("c");
    store.getState().deleteSection("c");
    expect(store.getState().selectedSectionId).toBe("a");
  });

  it("allows deleting the last section", () => {
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(createTestExam([createTestSection([], { id: "only" })]));

    store.getState().deleteSection("only");

    expect(store.getState().exam?.sections).toEqual([]);
    expect(store.getState().selectedSectionId).toBeNull();
  });

  it("duplicates after the source with regenerated internal IDs", () => {
    const store = createExamBuilderStore(createRuntime());
    const duplicableBlocks = allBlockExamples.filter(
      (block) => block.type !== "essay",
    );
    store
      .getState()
      .initialize(
        createTestExam([
          createTestSection(duplicableBlocks, { id: "source", title: "A" }),
        ]),
      );

    const duplicateId = store.getState().duplicateSection("source");
    const [source, duplicate] = store.getState().exam?.sections ?? [];

    expect(duplicateId).toBe("generated-1");
    expect(duplicate?.title).toBe(source?.title);
    expect(duplicate?.blocks.map((block) => block.type)).toEqual(
      source?.blocks.map((block) => block.type),
    );
    expect(duplicate?.blocks.map((block) => block.id)).not.toEqual(
      source?.blocks.map((block) => block.id),
    );
    const sourceImage = source?.blocks.find((block) => block.type === "image");
    const duplicateImage = duplicate?.blocks.find(
      (block) => block.type === "image",
    );
    expect(duplicateImage?.type).toBe("image");
    if (sourceImage?.type === "image" && duplicateImage?.type === "image") {
      expect(duplicateImage.imageId).toBe(sourceImage.imageId);
    }
    expect(store.getState().selectedSectionId).toBe(duplicateId);
  });

  it("reorders sections and ignores boundary moves", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    store.getState().moveSectionUp("c");
    expect(
      store.getState().exam?.sections.map((section) => section.id),
    ).toEqual(["a", "c", "b"]);
    const revision = store.getState().revision;
    store.getState().moveSectionUp("a");
    expect(store.getState().revision).toBe(revision);
    store.getState().moveSectionDown("b");
    expect(store.getState().revision).toBe(revision);
  });

  it("reorders sections by ID as one history entry and ignores a no-op drop", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    store.getState().reorderSections("a", "c");
    expect(
      store.getState().exam?.sections.map((section) => section.id),
    ).toEqual(["b", "c", "a"]);
    expect(store.getState().past).toHaveLength(1);
    expect(store.getState().revision).toBe(1);

    store.getState().reorderSections("a", "a");
    expect(store.getState().past).toHaveLength(1);
    expect(store.getState().revision).toBe(1);

    store.getState().undo();
    expect(
      store.getState().exam?.sections.map((section) => section.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("invalidates future after a new edit", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());
    store.getState().setSectionTitle("a", "First edit");
    store.getState().undo();
    expect(store.getState().future).toHaveLength(1);

    store.getState().setSectionTitle("a", "Different edit");

    expect(store.getState().future).toEqual([]);
  });

  it("bounds snapshot history", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());

    for (let index = 0; index < MAX_HISTORY_ENTRIES + 10; index += 1) {
      store.getState().setSectionTitle("a", `Title ${index}`);
    }

    expect(store.getState().past).toHaveLength(MAX_HISTORY_ENTRIES);
  });

  it("keeps a newer revision dirty when an older save completes", () => {
    const store = createExamBuilderStore(createRuntime());
    store.getState().initialize(createThreeSectionExam());
    store.getState().setSectionTitle("a", "Revision 1");
    store.getState().startSaving(1);
    store.getState().setSectionTitle("a", "Revision 2");

    store.getState().completeSave(1);

    expect(store.getState()).toMatchObject({
      revision: 2,
      savedRevision: 1,
      saveStatus: "dirty",
    });
  });
});

describe("Exam Builder block actions", () => {
  it("keeps block selection inside the selected section without history", () => {
    const store = createExamBuilderStore(createRuntime());
    const first = allBlockExamples[0]!;
    const second = allBlockExamples[1]!;
    store
      .getState()
      .initialize(
        createTestExam([
          createTestSection([first], { id: "a" }),
          createTestSection([second], { id: "b" }),
        ]),
      );

    expect(store.getState().selectedBlockId).toBe(first.id);
    store.getState().selectSection("b");
    expect(store.getState().selectedBlockId).toBe(second.id);
    store.getState().selectBlock(first.id);
    expect(store.getState().selectedBlockId).toBe(second.id);
    expect(store.getState().past).toEqual([]);
    expect(store.getState().revision).toBe(0);
  });

  it("adds blocks, selects the newest, and normalizes every order", () => {
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(createTestExam([createTestSection([], { id: "section" })]));

    const questionResult = store.getState().addBlock("question");
    const tableResult = store.getState().addBlock("table");
    const blocks = store.getState().exam?.sections[0]?.blocks ?? [];

    expect(questionResult).toEqual({ ok: true, id: "generated-1" });
    expect(tableResult.ok).toBe(true);
    expect(blocks.map((block) => block.type)).toEqual(["question", "table"]);
    expect(blocks.map((block) => block.order)).toEqual([0, 1]);
    expect(store.getState().selectedBlockId).toBe(
      tableResult.ok ? tableResult.id : null,
    );
    expect(store.getState()).toMatchObject({
      revision: 2,
      saveStatus: "dirty",
    });
    expect(store.getState().past).toHaveLength(2);
  });

  it("enforces the essay limit across sections for add and duplicate", () => {
    const essay = allBlockExamples.find((block) => block.type === "essay")!;
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([
          createTestSection([essay], { id: "a" }),
          createTestSection([], { id: "b" }),
        ]),
      );

    store.getState().selectSection("b");
    expect(store.getState().addBlock("essay")).toEqual({
      ok: false,
      reason: "ESSAY_LIMIT_REACHED",
    });
    store.getState().selectSection("a");
    expect(store.getState().duplicateBlock(essay.id)).toEqual({
      ok: false,
      reason: "ESSAY_LIMIT_REACHED",
    });
    expect(store.getState().duplicateSection("a")).toBeNull();
    expect(store.getState()).toMatchObject({ revision: 0, past: [] });
  });

  it("refuses to create an ImageBlock without a real asset", () => {
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(createTestExam([createTestSection([], { id: "section" })]));

    expect(store.getState().addBlock("image")).toEqual({
      ok: false,
      reason: "IMAGE_ASSET_REQUIRED",
    });
    expect(store.getState().exam?.sections[0]?.blocks).toEqual([]);
    expect(store.getState()).toMatchObject({ revision: 0, past: [] });
  });

  it("adds an ImageBlock only through an explicit real asset ID", () => {
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(createTestExam([createTestSection([], { id: "section" })]));

    expect(store.getState().addImageBlock("asset-real")).toEqual({
      ok: true,
      id: "generated-1",
    });
    expect(store.getState().exam?.sections[0]?.blocks[0]).toMatchObject({
      id: "generated-1",
      type: "image",
      startsNewQuestion: false,
      imageId: "asset-real",
      alignment: "center",
    });
    expect(store.getState()).toMatchObject({
      revision: 1,
      saveStatus: "dirty",
    });
  });

  it("coalesces one continuous field edit while keeping each revision", () => {
    const question = allBlockExamples.find(
      (block) => block.type === "question",
    )!;
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([createTestSection([question], { id: "section" })]),
      );
    const key = `block:${question.id}:question`;

    for (const text of ["Q", "Qu", "Question"]) {
      store
        .getState()
        .updateBlock(
          question.id,
          (block) =>
            block.type === "question" ? { ...block, question: text } : block,
          { historyGroup: key },
        );
    }

    expect(store.getState()).toMatchObject({ revision: 3 });
    expect(store.getState().past).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().exam?.sections[0]?.blocks[0]).toMatchObject({
      question: "Explain the event",
    });

    store.getState().redo();
    store.getState().endHistoryGroup(key);
    store
      .getState()
      .updateBlock(
        question.id,
        (block) =>
          block.type === "question" ? { ...block, question: "Next" } : block,
        { historyGroup: key },
      );
    expect(store.getState().past).toHaveLength(2);
  });

  it("rejects structurally invalid block updates", () => {
    const question = allBlockExamples.find(
      (block) => block.type === "question",
    )!;
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([createTestSection([question], { id: "section" })]),
      );

    const result = store.getState().updateBlock(question.id, (block) => ({
      ...block,
      points: -1,
    }));

    expect(result).toEqual({ ok: false, reason: "INVALID_BLOCK" });
    expect(store.getState()).toMatchObject({ revision: 0, past: [] });
  });

  it("selects next, previous, then null when deleting selected blocks", () => {
    const blocks = allBlockExamples.slice(0, 3);
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([createTestSection(blocks, { id: "section" })]),
      );

    store.getState().selectBlock(blocks[1]!.id);
    store.getState().deleteBlock(blocks[1]!.id);
    expect(store.getState().selectedBlockId).toBe(blocks[2]!.id);
    store.getState().deleteBlock(blocks[2]!.id);
    expect(store.getState().selectedBlockId).toBe(blocks[0]!.id);
    store.getState().deleteBlock(blocks[0]!.id);
    expect(store.getState().selectedBlockId).toBeNull();
    expect(
      store.getState().exam?.sections[0]?.blocks.map((block) => block.order),
    ).toEqual([]);
  });

  it("deeply duplicates immediately after the source and selects the copy", () => {
    const definition = allBlockExamples.find(
      (block) => block.type === "definition",
    )!;
    const trailing = allBlockExamples.find(
      (block) => block.type === "page-break",
    )!;
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([
          createTestSection([definition, trailing], { id: "section" }),
        ]),
      );

    const result = store.getState().duplicateBlock(definition.id);
    const blocks = store.getState().exam?.sections[0]?.blocks ?? [];

    expect(result.ok).toBe(true);
    expect(blocks.map((block) => block.type)).toEqual([
      "definition",
      "definition",
      "page-break",
    ]);
    expect(blocks.map((block) => block.order)).toEqual([0, 1, 2]);
    expect(store.getState().selectedBlockId).toBe(result.ok ? result.id : null);
    if (blocks[0]?.type === "definition" && blocks[1]?.type === "definition") {
      expect(blocks[1].items[0]?.term).toBe(blocks[0].items[0]?.term);
      expect(blocks[1].items[0]?.id).not.toBe(blocks[0].items[0]?.id);
    }
  });

  it("reorders once, treats a same-position drop as a no-op, and supports undo", () => {
    const blocks = allBlockExamples.slice(0, 3);
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([createTestSection(blocks, { id: "section" })]),
      );

    store.getState().reorderBlocks(blocks[0]!.id, blocks[2]!.id);
    expect(
      store.getState().exam?.sections[0]?.blocks.map((block) => block.id),
    ).toEqual([blocks[1]!.id, blocks[2]!.id, blocks[0]!.id]);
    expect(
      store.getState().exam?.sections[0]?.blocks.map((block) => block.order),
    ).toEqual([0, 1, 2]);
    expect(store.getState()).toMatchObject({ revision: 1 });
    expect(store.getState().past).toHaveLength(1);

    store.getState().reorderBlocks(blocks[0]!.id, blocks[0]!.id);
    expect(store.getState()).toMatchObject({ revision: 1 });
    expect(store.getState().past).toHaveLength(1);

    store.getState().undo();
    expect(
      store.getState().exam?.sections[0]?.blocks.map((block) => block.id),
    ).toEqual(blocks.map((block) => block.id));
    expect(
      store.getState().exam?.sections[0]?.blocks.map((block) => block.order),
    ).toEqual([0, 1, 2]);
  });

  it("tracks Timeline and Chart mutations through undo and redo", () => {
    const timeline = allBlockExamples.find(
      (block) => block.type === "timeline",
    )!;
    const chart = allBlockExamples.find((block) => block.type === "chart")!;
    const store = createExamBuilderStore(createRuntime());
    store
      .getState()
      .initialize(
        createTestExam([
          createTestSection([timeline, chart], { id: "visuals" }),
        ]),
      );

    store.getState().updateBlock(timeline.id, (block) =>
      block.type === "timeline"
        ? {
            ...block,
            events: [
              ...block.events,
              {
                id: "event-new",
                date: "1975",
                axisValue: null,
                label: "Green March",
                description: "",
              },
            ],
          }
        : block,
    );
    store
      .getState()
      .updateBlock(chart.id, (block) =>
        block.type === "chart"
          ? addChartCategory(block, { id: "category-new", label: "1980" })
          : block,
      );
    expect(store.getState().revision).toBe(2);
    expect(store.getState().past).toHaveLength(2);

    store.getState().undo();
    const undoneChart = store
      .getState()
      .exam?.sections[0]?.blocks.find((block) => block.type === "chart");
    expect(undoneChart?.type).toBe("chart");
    if (undoneChart?.type === "chart") {
      expect(undoneChart.labels).toHaveLength(2);
    }
    store.getState().undo();
    const undoneTimeline = store
      .getState()
      .exam?.sections[0]?.blocks.find((block) => block.type === "timeline");
    if (undoneTimeline?.type === "timeline") {
      expect(undoneTimeline.events).toHaveLength(2);
    }
    store.getState().redo();
    const redoneTimeline = store
      .getState()
      .exam?.sections[0]?.blocks.find((block) => block.type === "timeline");
    if (redoneTimeline?.type === "timeline") {
      expect(redoneTimeline.events).toHaveLength(3);
    }
  });
});
