import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import type { ImageAssetRecord } from "@/domain/assets";
import type { Exam, ImageBlock } from "@/domain/exam";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { BlockEditor } from "@/features/exam-builder/components/BlockEditor";
import { SectionEditor } from "@/features/exam-builder/components/SectionEditor";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

const createObjectUrl = vi.fn(() => "blob:preview");
const revokeObjectUrl = vi.fn();

function asset(id = "asset-a", content = "first"): ImageAssetRecord {
  const blob = new Blob([content], { type: "image/png" });
  return {
    id,
    kind: "image",
    blob,
    mimeType: "image/png",
    fileName: `${id}.png`,
    size: blob.size,
    createdAt: "2026-08-22T12:00:00.000Z",
  };
}

function imageBlock(imageId = "asset-a"): ImageBlock {
  return {
    id: "image-block",
    type: "image",
    startsNewQuestion: false,
    order: 0,
    imageId,
    alignment: "center",
  };
}

function renderWithAssets(
  exam: Exam,
  repository: FakeAssetRepository,
  view: "block" | "section" = "block",
) {
  let id = 0;
  const store = createExamBuilderStore({
    createId: () => `block-${++id}`,
    now: () => "2026-08-22T12:00:00.000Z",
  });
  store.getState().initialize(exam);
  const result = render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={repository}>
        <ExamBuilderStoreProvider store={store}>
          {view === "block" ? <BlockEditor /> : <SectionEditor />}
        </ExamBuilderStoreProvider>
      </AssetRepositoryProvider>
    </I18nextProvider>,
  );
  return { ...result, store };
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
  createObjectUrl.mockClear();
  revokeObjectUrl.mockClear();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectUrl,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectUrl,
  });
});

describe("Image creation workflow", () => {
  it("saves a real asset before creating its ImageBlock", async () => {
    const user = userEvent.setup();
    const repository = new FakeAssetRepository();
    const { store } = renderWithAssets(
      createTestExam([createTestSection([], { id: "section" })]),
      repository,
      "section",
    );

    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    await user.click(screen.getByRole("button", { name: "Image / document" }));
    const file = new File(["png"], "map.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Choisir une image"), file);

    await waitFor(() => {
      expect(store.getState().exam?.sections[0]?.blocks).toHaveLength(1);
    });
    const block = store.getState().exam?.sections[0]?.blocks[0];
    expect(block?.type).toBe("image");
    if (block?.type === "image") {
      expect(repository.records.has(block.imageId)).toBe(true);
      expect(block.imageId).not.toMatch(/image-asset|placeholder|fake/);
    }
    expect(
      await screen.findByRole("img", { name: "Aperçu de l’image" }),
    ).toBeVisible();
  });

  it("does not create an ImageBlock when asset persistence fails", async () => {
    const user = userEvent.setup();
    const repository = new FakeAssetRepository();
    repository.failOnSave = true;
    const { store } = renderWithAssets(
      createTestExam([createTestSection([], { id: "section" })]),
      repository,
      "section",
    );

    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    await user.upload(
      screen.getByLabelText("Choisir une image"),
      new File(["png"], "map.png", { type: "image/png" }),
    );

    expect(
      await screen.findByText(
        "Impossible d’enregistrer l’image sur cet appareil.",
      ),
    ).toBeVisible();
    expect(store.getState().exam?.sections[0]?.blocks).toEqual([]);
  });

  it("rejects unsupported files without saving or mutating the Exam", async () => {
    const user = userEvent.setup();
    const repository = new FakeAssetRepository();
    const { store } = renderWithAssets(
      createTestExam([createTestSection([], { id: "section" })]),
      repository,
      "section",
    );
    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    fireEvent.change(screen.getByLabelText("Choisir une image"), {
      target: {
        files: [new File(["svg"], "map.svg", { type: "image/svg+xml" })],
      },
    });

    expect(
      await screen.findByText("Choisissez une image PNG, JPEG ou WEBP."),
    ).toBeVisible();
    expect(repository.records.size).toBe(0);
    expect(store.getState()).toMatchObject({ revision: 0, past: [] });
  });
});

describe("ImageBlockEditor", () => {
  it("loads a preview and edits all visual metadata", async () => {
    const user = userEvent.setup();
    const repository = new FakeAssetRepository([asset()]);
    const { store } = renderWithAssets(
      createTestExam([createTestSection([imageBlock()], { id: "section" })]),
      repository,
    );

    expect(
      await screen.findByRole("img", { name: "Aperçu de l’image" }),
    ).toHaveAttribute("src", "blob:preview");
    await user.type(screen.getByLabelText("Titre"), "Carte du Maroc");
    await user.type(screen.getByLabelText("Légende"), "المغرب");
    await user.type(screen.getByLabelText("Source"), "Archive");
    fireEvent.change(screen.getByLabelText("Largeur relative"), {
      target: { value: "75" },
    });
    await user.selectOptions(screen.getByLabelText("Alignement"), "end");
    await user.click(
      screen.getByRole("checkbox", { name: "Afficher une bordure" }),
    );

    expect(store.getState().exam?.sections[0]?.blocks[0]).toMatchObject({
      type: "image",
      startsNewQuestion: false,
      imageId: "asset-a",
      title: "Carte du Maroc",
      caption: "المغرب",
      source: "Archive",
      width: 75,
      alignment: "end",
      bordered: true,
    });
    expect(screen.getByLabelText("Légende")).toHaveAttribute("dir", "auto");
  });

  it("replaces an asset, supports Undo, and retains both assets", async () => {
    const user = userEvent.setup();
    const repository = new FakeAssetRepository([asset()]);
    const { store } = renderWithAssets(
      createTestExam([createTestSection([imageBlock()], { id: "section" })]),
      repository,
    );
    await screen.findByRole("img", { name: "Aperçu de l’image" });

    await user.upload(
      screen.getByLabelText("Remplacer l’image"),
      new File(["replacement"], "new.webp", { type: "image/webp" }),
    );
    await waitFor(() => {
      expect(
        (store.getState().exam?.sections[0]?.blocks[0] as ImageBlock).imageId,
      ).not.toBe("asset-a");
    });
    const replacementId = (
      store.getState().exam?.sections[0]?.blocks[0] as ImageBlock
    ).imageId;
    expect(repository.records.has("asset-a")).toBe(true);
    expect(repository.records.has(replacementId)).toBe(true);

    act(() => store.getState().undo());
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as ImageBlock).imageId,
    ).toBe("asset-a");
    act(() => store.getState().redo());
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as ImageBlock).imageId,
    ).toBe(replacementId);

    act(() => store.getState().deleteBlock("image-block"));
    expect(repository.records.has("asset-a")).toBe(true);
    expect(repository.records.has(replacementId)).toBe(true);
  });

  it("handles a missing asset gracefully and keeps replacement available", async () => {
    renderWithAssets(
      createTestExam([
        createTestSection([imageBlock("missing")], { id: "section" }),
      ]),
      new FakeAssetRepository(),
    );

    expect(await screen.findByText(/Image introuvable/)).toBeVisible();
    expect(screen.getByLabelText("Remplacer l’image")).toBeEnabled();
  });

  it("isolates repository read errors to the Image editor", async () => {
    const repository = new FakeAssetRepository();
    repository.failOnFind = true;
    renderWithAssets(
      createTestExam([
        createTestSection([imageBlock("corrupted")], { id: "section" }),
      ]),
      repository,
    );

    expect(
      await screen.findByText(/Impossible de charger cette image/),
    ).toBeVisible();
    expect(screen.getByLabelText("Remplacer l’image")).toBeEnabled();
  });

  it("revokes object URLs on cleanup", async () => {
    const repository = new FakeAssetRepository([asset()]);
    const view = renderWithAssets(
      createTestExam([createTestSection([imageBlock()], { id: "section" })]),
      repository,
    );
    await screen.findByRole("img", { name: "Aperçu de l’image" });

    view.unmount();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview");
  });
});
