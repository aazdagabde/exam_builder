import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import { useExamAutosave } from "@/features/exam-builder/hooks/useExamAutosave";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { ExportDocxButton } from "@/features/export-docx/components/ExportDocxButton";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

const docxMocks = vi.hoisted(() => ({ exportExamDocx: vi.fn() }));

vi.mock(
  "@/features/export-docx/services/export-exam-docx",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/features/export-docx/services/export-exam-docx")
      >();
    return { ...actual, exportExamDocx: docxMocks.exportExamDocx };
  },
);

const assetRepository: AssetRepository = {
  findById: vi.fn().mockResolvedValue(null),
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
};

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
  return <ExportDocxButton saveNow={saveNow} />;
}

function renderButton(
  repository: FakeExamRepository,
  store: ReturnType<typeof createStore>,
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExamRepositoryProvider repository={repository}>
        <AssetRepositoryProvider repository={assetRepository}>
          <ExamBuilderStoreProvider store={store}>
            <Harness />
          </ExamBuilderStoreProvider>
        </AssetRepositoryProvider>
      </ExamRepositoryProvider>
    </I18nextProvider>,
  );
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  docxMocks.exportExamDocx.mockReset().mockResolvedValue({
    warnings: [],
    imageWarnings: [],
    unavailableImageCount: 0,
  });
});

describe("ExportDocxButton", () => {
  it("saves a dirty Exam before generating Word", async () => {
    const events: string[] = [];
    const repository = new FakeExamRepository([], {
      save: async () => {
        events.push("save");
      },
    });
    const store = createStore();
    store.getState().setSectionTitle("section", "Changed");
    docxMocks.exportExamDocx.mockImplementation(async () => {
      events.push("docx");
      return { warnings: [], imageWarnings: [], unavailableImageCount: 0 };
    });
    renderButton(repository, store);

    fireEvent.click(screen.getByRole("button", { name: "Exporter Word" }));

    await waitFor(() =>
      expect(docxMocks.exportExamDocx).toHaveBeenCalledOnce(),
    );
    expect(events).toEqual(["save", "docx"]);
  });

  it("blocks generation when persistence fails", async () => {
    const repository = new FakeExamRepository([], {
      save: async () => {
        throw new Error("save failed");
      },
    });
    const store = createStore();
    store.getState().setSectionTitle("section", "Dirty");
    renderButton(repository, store);

    fireEvent.click(screen.getByRole("button", { name: "Exporter Word" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible d’enregistrer le devoir avant l’export.",
    );
    expect(docxMocks.exportExamDocx).not.toHaveBeenCalled();
  });

  it("blocks a second click while generation is pending", async () => {
    let finish: (() => void) | undefined;
    docxMocks.exportExamDocx.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () =>
            resolve({
              warnings: [],
              imageWarnings: [],
              unavailableImageCount: 0,
            });
        }),
    );
    renderButton(new FakeExamRepository(), createStore());
    const button = screen.getByRole("button", { name: "Exporter Word" });

    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() =>
      expect(docxMocks.exportExamDocx).toHaveBeenCalledOnce(),
    );
    expect(button).toBeDisabled();
    await act(async () => finish?.());
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("uses Arabic UI without changing the Exam document language", async () => {
    await changeInterfaceLanguage("ar");
    const store = createStore();
    store.getState().exam!.settings.documentLanguage = "fr";
    renderButton(new FakeExamRepository(), store);

    fireEvent.click(screen.getByRole("button", { name: "تصدير Word" }));
    await waitFor(() =>
      expect(docxMocks.exportExamDocx).toHaveBeenCalledOnce(),
    );
    expect(
      docxMocks.exportExamDocx.mock.calls[0][0].exam.settings.documentLanguage,
    ).toBe("fr");
  });

  it("reports missing image placeholders after a successful export", async () => {
    docxMocks.exportExamDocx.mockResolvedValue({
      warnings: [],
      imageWarnings: [{ code: "IMAGE_MISSING", imageId: "missing" }],
      unavailableImageCount: 1,
    });
    renderButton(new FakeExamRepository(), createStore());

    fireEvent.click(screen.getByRole("button", { name: "Exporter Word" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "1 image indisponible",
    );
  });
});
