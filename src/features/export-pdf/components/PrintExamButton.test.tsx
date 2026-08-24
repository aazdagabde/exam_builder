import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { useExamAutosave } from "@/features/exam-builder/hooks/useExamAutosave";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { PrintExamButton } from "@/features/export-pdf/components/PrintExamButton";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

const printMocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  print: vi.fn(),
}));

vi.mock("@/features/export-pdf/services/print-exam", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/export-pdf/services/print-exam")
    >();
  return {
    ...actual,
    prepareExamForPrint: printMocks.prepare,
    printPreparedExam: printMocks.print,
  };
});

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

function Harness() {
  const saveNow = useExamAutosave(60_000);
  return <PrintExamButton saveNow={saveNow} />;
}

function renderButton(
  repository: FakeExamRepository,
  store: ReturnType<typeof createStore>,
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExamRepositoryProvider repository={repository}>
        <ExamBuilderStoreProvider store={store}>
          <Harness />
        </ExamBuilderStoreProvider>
      </ExamRepositoryProvider>
    </I18nextProvider>,
  );
}

function openExportDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Exporter PDF" }));
}

function continueExport(mode: "one-up" | "two-up" = "one-up") {
  openExportDialog();
  if (mode === "two-up") {
    fireEvent.click(
      screen.getByRole("radio", { name: /Deux pages par feuille/ }),
    );
  }
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  printMocks.prepare.mockReset();
  printMocks.print.mockReset().mockResolvedValue(undefined);
  printMocks.prepare.mockImplementation(async (options) => {
    await options.ensureSaved();
    const snapshot = options.getSnapshot();
    return {
      exam: snapshot.exam!,
      revision: snapshot.revision,
      root: document.createElement("div"),
      pageCount: 1,
      warnings: [],
      unavailableImageCount: 0,
    };
  });
});

describe("PrintExamButton", () => {
  it("is visible in French and prints only after flushing a dirty Exam", async () => {
    const events: string[] = [];
    const repository = new FakeExamRepository([], {
      save: async () => {
        events.push("save");
      },
    });
    const store = createStore();
    store.getState().setSectionTitle("section", "Changed");
    printMocks.print.mockImplementation(async () => {
      events.push("print");
    });
    renderButton(repository, store);

    continueExport();

    await waitFor(() => expect(printMocks.print).toHaveBeenCalledOnce());
    expect(printMocks.print).toHaveBeenCalledWith(
      expect.objectContaining({ layoutMode: "one-up" }),
    );
    expect(events).toEqual(["save", "print"]);
    expect(repository.savedExams).toHaveLength(1);
  });

  it("does not save an Exam that is already current", async () => {
    const repository = new FakeExamRepository();
    renderButton(repository, createStore());

    continueExport();

    await waitFor(() => expect(printMocks.print).toHaveBeenCalledOnce());
    expect(repository.savedExams).toHaveLength(0);
  });

  it("blocks print and exposes a retryable error when save fails", async () => {
    const repository = new FakeExamRepository([], {
      save: async () => {
        throw new Error("Save failed");
      },
    });
    const store = createStore();
    store.getState().setSectionTitle("section", "Unsaved");
    renderButton(repository, store);

    continueExport();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "L’enregistrement a échoué. Réessayez avant d’exporter.",
    );
    expect(printMocks.print).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Continuer" })).toBeEnabled();
  });

  it("blocks a second export while preparation is pending", async () => {
    let resolvePreparation: (() => void) | undefined;
    const preparation = new Promise<void>((resolve) => {
      resolvePreparation = resolve;
    });
    printMocks.prepare.mockImplementation(async (options) => {
      await preparation;
      const snapshot = options.getSnapshot();
      return {
        exam: snapshot.exam!,
        revision: snapshot.revision,
        root: document.createElement("div"),
        pageCount: 1,
        warnings: [],
        unavailableImageCount: 0,
      };
    });
    renderButton(new FakeExamRepository(), createStore());
    openExportDialog();
    const button = screen.getByRole("button", { name: "Continuer" });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(printMocks.prepare).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName("Préparation…");
    await act(async () => resolvePreparation?.());
    await waitFor(() => expect(printMocks.print).toHaveBeenCalledOnce());
  });

  it("uses the Arabic action without changing the document direction", async () => {
    await changeInterfaceLanguage("ar");
    document.documentElement.dir = "rtl";
    renderButton(new FakeExamRepository(), createStore());

    fireEvent.click(screen.getByRole("button", { name: "تصدير PDF" }));
    expect(
      screen.getByRole("heading", { name: "تخطيط ملف PDF" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: /صفحتان في كل ورقة/ }));
    fireEvent.click(screen.getByRole("button", { name: "متابعة" }));
    await waitFor(() => expect(printMocks.print).toHaveBeenCalledOnce());
    expect(printMocks.print).toHaveBeenCalledWith(
      expect.objectContaining({ layoutMode: "two-up" }),
    );
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });
});
