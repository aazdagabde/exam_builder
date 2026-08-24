import { act, render } from "@testing-library/react";

import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { AUTOSAVE_DELAY_MS } from "@/features/exam-builder/constants";
import { useExamAutosave } from "@/features/exam-builder/hooks/useExamAutosave";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

function createStore() {
  const store = createExamBuilderStore({
    createId: () => crypto.randomUUID(),
    now: () => "2026-08-23T12:00:00.000Z",
  });
  store
    .getState()
    .initialize(createTestExam([createTestSection([], { id: "section" })]));
  return store;
}

function AutosaveHarness({ delay = AUTOSAVE_DELAY_MS }: { delay?: number }) {
  useExamAutosave(delay);
  return null;
}

function renderAutosave(
  repository: FakeExamRepository,
  store: ReturnType<typeof createStore>,
) {
  return render(
    <ExamRepositoryProvider repository={repository}>
      <ExamBuilderStoreProvider store={store}>
        <AutosaveHarness />
      </ExamBuilderStoreProvider>
    </ExamRepositoryProvider>,
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useExamAutosave", () => {
  it("debounces a modification before saving", async () => {
    const repository = new FakeExamRepository();
    const store = createStore();
    renderAutosave(repository, store);

    act(() => store.getState().setSectionTitle("section", "Changed"));
    expect(repository.savedExams).toHaveLength(0);
    expect(store.getState().saveStatus).toBe("dirty");
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS - 1));
    expect(repository.savedExams).toHaveLength(0);

    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(repository.savedExams).toHaveLength(1);
    expect(repository.savedExams[0]?.sections[0]?.title).toBe("Changed");
    expect(store.getState().saveStatus).toBe("saved");
  });

  it("coalesces rapid edits into one save of the latest Exam", async () => {
    const repository = new FakeExamRepository();
    const store = createStore();
    renderAutosave(repository, store);

    act(() => store.getState().setSectionTitle("section", "A"));
    await act(async () => vi.advanceTimersByTimeAsync(200));
    act(() => store.getState().setSectionTitle("section", "AB"));
    await act(async () => vi.advanceTimersByTimeAsync(200));
    act(() => store.getState().setSectionTitle("section", "ABC"));
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(repository.savedExams).toHaveLength(1);
    expect(repository.savedExams[0]?.sections[0]?.title).toBe("ABC");
  });

  it("keeps the modified Exam and reports a save failure", async () => {
    const repository = new FakeExamRepository([], {
      save: async () => {
        throw new Error("Save failed");
      },
    });
    const store = createStore();
    renderAutosave(repository, store);
    act(() => store.getState().setSectionTitle("section", "Unsaved work"));

    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(store.getState().exam?.sections[0]?.title).toBe("Unsaved work");
    expect(store.getState().saveStatus).toBe("error");
    expect(store.getState().savedRevision).toBe(0);
  });

  it("retries normally after a new modification following an error", async () => {
    let attempt = 0;
    const repository = new FakeExamRepository([], {
      save: async () => {
        attempt += 1;
        if (attempt === 1) throw new Error("First save failed");
      },
    });
    const store = createStore();
    renderAutosave(repository, store);
    act(() => store.getState().setSectionTitle("section", "First"));
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
    expect(store.getState().saveStatus).toBe("error");

    act(() => store.getState().setSectionTitle("section", "Second"));
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));

    expect(attempt).toBe(2);
    expect(store.getState()).toMatchObject({
      savedRevision: 2,
      saveStatus: "saved",
    });
  });

  it("serializes a newer revision created during a pending save", async () => {
    let resolveFirst: (() => void) | undefined;
    let saveCalls = 0;
    const snapshots: string[] = [];
    const firstSave = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const repository = new FakeExamRepository([], {
      save: async (exam) => {
        saveCalls += 1;
        snapshots.push(exam.sections[0]?.title ?? "");
        if (saveCalls === 1) await firstSave;
      },
    });
    const store = createStore();
    renderAutosave(repository, store);

    act(() => store.getState().setSectionTitle("section", "Revision 1"));
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
    expect(saveCalls).toBe(1);
    expect(store.getState().saveStatus).toBe("saving");

    act(() => store.getState().setSectionTitle("section", "Revision 2"));
    await act(async () => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS));
    expect(store.getState().saveStatus).toBe("dirty");

    await act(async () => {
      resolveFirst?.();
      for (let index = 0; index < 10; index += 1) {
        await Promise.resolve();
      }
    });

    expect(saveCalls).toBe(2);
    expect(snapshots).toEqual(["Revision 1", "Revision 2"]);
    expect(store.getState()).toMatchObject({
      revision: 2,
      savedRevision: 2,
      saveStatus: "saved",
    });
  });

  it("flushes the latest dirty snapshot and cancels its timer on unmount", async () => {
    const repository = new FakeExamRepository();
    const store = createStore();
    const view = renderAutosave(repository, store);
    act(() =>
      store.getState().setSectionTitle("section", "Before route change"),
    );

    view.unmount();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await vi.runAllTimersAsync();

    expect(repository.savedExams).toHaveLength(1);
    expect(repository.savedExams[0]?.sections[0]?.title).toBe(
      "Before route change",
    );
  });
});
