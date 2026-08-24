import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import {
  ExamSchema,
  type EssayBlock,
  type ExamBlock,
  type MatchingBlock,
  type TableBlock,
} from "@/domain/exam";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { BlockEditor } from "@/features/exam-builder/components/BlockEditor";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

function renderAdvancedEditor(block: ExamBlock) {
  let id = 0;
  const store = createExamBuilderStore({
    createId: () => `generated-${++id}`,
    now: () => "2026-08-22T12:00:00.000Z",
  });
  store
    .getState()
    .initialize(
      createTestExam([createTestSection([block], { id: "section" })]),
    );
  render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={new FakeAssetRepository()}>
        <ExamBuilderStoreProvider store={store}>
          <BlockEditor />
        </ExamBuilderStoreProvider>
      </AssetRepositoryProvider>
    </I18nextProvider>,
  );
  return store;
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

describe("TableBlockEditor", () => {
  it("manages columns, rows and cells while preserving table invariants", async () => {
    const user = userEvent.setup();
    const block: TableBlock = {
      id: "table",
      type: "table",
      startsNewQuestion: true,
      order: 0,
      columns: [{ id: "a", label: "A" }],
      rows: [],
      showHeader: true,
    };
    const store = renderAdvancedEditor(block);

    expect(
      screen.getByRole("button", { name: "Supprimer Colonne 1" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Ajouter une ligne" }));
    await user.click(
      screen.getByRole("button", { name: "Ajouter une colonne" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ajouter une colonne" }),
    );
    const columns = screen.getAllByLabelText(/Colonne [123]$/);
    fireEvent.change(columns[1]!, { target: { value: "B" } });
    fireEvent.change(columns[2]!, { target: { value: "C" } });
    fireEvent.change(screen.getByLabelText("Ligne 1, colonne A"), {
      target: { value: "A1" },
    });
    fireEvent.change(screen.getByLabelText("Ligne 1, colonne B"), {
      target: { value: "B1" },
    });
    fireEvent.change(screen.getByLabelText("Ligne 1, colonne C"), {
      target: { value: "C1" },
    });
    await user.click(screen.getByRole("button", { name: "Monter Colonne 3" }));
    await user.click(screen.getByRole("button", { name: "Monter Colonne 2" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Afficher l’en-tête" }),
    );

    let value = store.getState().exam?.sections[0]?.blocks[0] as TableBlock;
    expect(value.columns.map((column) => column.label)).toEqual([
      "C",
      "A",
      "B",
    ]);
    expect(value.rows[0]?.cells).toEqual([
      expect.objectContaining({ columnId: value.columns[0]!.id, value: "C1" }),
      expect.objectContaining({ columnId: "a", value: "A1" }),
      expect.objectContaining({ columnId: value.columns[2]!.id, value: "B1" }),
    ]);
    expect(value.showHeader).toBe(false);

    await user.click(
      screen.getByRole("button", { name: "Supprimer Colonne 2" }),
    );
    value = store.getState().exam?.sections[0]?.blocks[0] as TableBlock;
    expect(value.columns.map((column) => column.label)).toEqual(["C", "B"]);
    expect(value.rows[0]?.cells.map((cell) => cell.columnId)).toEqual(
      value.columns.map((column) => column.id),
    );
    await user.click(screen.getByRole("button", { name: "Ajouter une ligne" }));
    await user.click(screen.getByRole("button", { name: "Monter Ligne 2" }));
    await user.click(screen.getByRole("button", { name: "Supprimer Ligne 2" }));
    value = store.getState().exam?.sections[0]?.blocks[0] as TableBlock;
    expect(value.rows).toHaveLength(1);
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
  });

  it("coalesces a cell edit and supports row Undo/Redo", async () => {
    const user = userEvent.setup();
    const block: TableBlock = {
      id: "table",
      type: "table",
      startsNewQuestion: true,
      order: 0,
      columns: [{ id: "year", label: "Année" }],
      rows: [{ id: "row", cells: [{ columnId: "year", value: "" }] }],
      showHeader: true,
    };
    const store = renderAdvancedEditor(block);

    await user.type(screen.getByLabelText("Ligne 1, colonne Année"), "1956");
    await user.tab();
    expect(store.getState().past).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Ajouter une ligne" }));
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as TableBlock).rows,
    ).toHaveLength(2);
    act(() => store.getState().undo());
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as TableBlock).rows,
    ).toHaveLength(1);
    act(() => store.getState().redo());
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as TableBlock).rows,
    ).toHaveLength(2);
  });
});

describe("MatchingBlockEditor", () => {
  it("manages independent columns without storing correct pairs", async () => {
    const user = userEvent.setup();
    const block: MatchingBlock = {
      id: "matching",
      type: "matching",
      startsNewQuestion: true,
      order: 0,
      leftItems: [],
      rightItems: [],
    };
    const store = renderAdvancedEditor(block);

    await user.type(screen.getByLabelText("Consigne"), "Reliez les éléments");
    await user.click(screen.getByRole("button", { name: "Ajouter à gauche" }));
    await user.click(screen.getByRole("button", { name: "Ajouter à gauche" }));
    await user.click(screen.getByRole("button", { name: "Ajouter à droite" }));
    const items = screen.getAllByLabelText(/Élément [12]/);
    await user.type(items[0]!, "Indépendance");
    await user.type(items[1]!, "Marche verte");
    await user.type(items[2]!, "1956");
    await user.click(screen.getByRole("button", { name: "Monter Élément 2" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: "Mélanger la colonne droite au rendu",
      }),
    );

    const value = store.getState().exam?.sections[0]
      ?.blocks[0] as MatchingBlock;
    expect(value.leftItems.map((item) => item.text)).toEqual([
      "Marche verte",
      "Indépendance",
    ]);
    expect(value.rightItems.map((item) => item.text)).toEqual(["1956"]);
    expect(value.shuffleRight).toBe(true);
    expect(JSON.stringify(value)).not.toMatch(/correct|pair|answer/i);
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
    await user.click(
      screen.getByRole("button", { name: "Supprimer Élément 2" }),
    );
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as MatchingBlock)
        .leftItems,
    ).toHaveLength(1);
  });
});

describe("EssayBlockEditor", () => {
  it("edits context, instruction, topics and decimal points", async () => {
    const user = userEvent.setup();
    const block: EssayBlock = {
      id: "essay",
      type: "essay",
      startsNewQuestion: true,
      order: 0,
      instruction: "",
      topics: [],
    };
    const store = renderAdvancedEditor(block);

    await user.type(screen.getByLabelText("Contexte"), "السياق التاريخي");
    await user.type(screen.getByLabelText("Consigne"), "Rédigez un sujet");
    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    const topics = screen.getAllByLabelText(/Élément [12]/);
    await user.type(topics[0]!, "Introduction");
    await user.type(topics[1]!, "Conclusion");
    fireEvent.change(screen.getByLabelText("Points"), {
      target: { value: "7.5" },
    });
    await user.click(screen.getByRole("button", { name: "Monter Élément 2" }));

    const value = store.getState().exam?.sections[0]?.blocks[0] as EssayBlock;
    expect(value).toMatchObject({
      context: "السياق التاريخي",
      instruction: "Rédigez un sujet",
      points: 7.5,
    });
    expect(value.topics.map((topic) => topic.text)).toEqual([
      "Conclusion",
      "Introduction",
    ]);
    expect(screen.getByLabelText("Contexte")).toHaveAttribute("dir", "auto");
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
    await user.click(
      screen.getByRole("button", { name: "Supprimer Élément 2" }),
    );
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as EssayBlock).topics,
    ).toHaveLength(1);
  });
});

describe("Advanced editors RTL", () => {
  it("keeps matching Domain sides stable in an Arabic interface", async () => {
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");
    const block: MatchingBlock = {
      id: "matching",
      type: "matching",
      startsNewQuestion: true,
      order: 0,
      leftItems: [{ id: "left", text: "Texte français" }],
      rightItems: [{ id: "right", text: "1956" }],
    };
    const store = renderAdvancedEditor(block);

    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(document.querySelector("#matching-left-left")).toHaveAttribute(
      "dir",
      "auto",
    );
    expect(
      (store.getState().exam?.sections[0]?.blocks[0] as MatchingBlock)
        .leftItems[0]?.id,
    ).toBe("left");
  });
});
