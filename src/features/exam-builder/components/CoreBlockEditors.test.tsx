import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import type { StoreApi } from "zustand/vanilla";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import {
  ExamSchema,
  type DefinitionBlock,
  type ExamBlock,
  type FillBlankBlock,
  type FreeTextBlock,
  type InstructionBlock,
  type MultipleChoiceBlock,
  type TextDocumentBlock,
  type TrueFalseBlock,
} from "@/domain/exam";
import {
  allBlockExamples,
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { getBlockCatalogEntry } from "@/features/exam-builder/blocks/block-catalog";
import { BlockEditor } from "@/features/exam-builder/components/BlockEditor";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import type { ExamBuilderStore } from "@/features/exam-builder/store/exam-builder.types";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

function renderEditor(block: ExamBlock) {
  const store = createExamBuilderStore();
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

function currentBlock(store: StoreApi<ExamBuilderStore>) {
  return store.getState().exam?.sections[0]?.blocks[0];
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

describe("Core block editors", () => {
  it("edits an instruction with auto direction and one undo entry per field session", async () => {
    const user = userEvent.setup();
    const block: InstructionBlock = {
      id: "instruction",
      type: "instruction",
      startsNewQuestion: false,
      order: 0,
      content: "",
    };
    const store = renderEditor(block);
    const input = screen.getByLabelText("Consigne");

    expect(input).toHaveAttribute("dir", "auto");
    await user.type(input, "اقرأ الوثيقة جيداً");
    await user.tab();

    expect(currentBlock(store)).toMatchObject({
      type: "instruction",
      startsNewQuestion: false,
      content: "اقرأ الوثيقة جيداً",
    });
    expect(store.getState().past).toHaveLength(1);
    act(() => store.getState().undo());
    expect(input).toHaveValue("");
  });

  it("edits FreeText content and its real Domain variant", async () => {
    const user = userEvent.setup();
    const block: FreeTextBlock = {
      id: "free-text",
      type: "free-text",
      startsNewQuestion: false,
      order: 0,
      content: "",
    };
    const store = renderEditor(block);

    await user.selectOptions(screen.getByLabelText("Présentation"), "note");
    await user.type(screen.getByLabelText("Texte"), "Repère important");
    await user.tab();

    expect(currentBlock(store)).toMatchObject({
      type: "free-text",
      startsNewQuestion: false,
      variant: "note",
      content: "Repère important",
    });
    act(() => store.getState().undo());
    expect(currentBlock(store)).toMatchObject({
      type: "free-text",
      startsNewQuestion: false,
      variant: "note",
      content: "",
    });
  });

  it("edits every TextDocument field and preserves valid structured data", async () => {
    const user = userEvent.setup();
    const block: TextDocumentBlock = {
      id: "document",
      type: "text-document",
      startsNewQuestion: false,
      order: 0,
      content: "",
    };
    const store = renderEditor(block);

    await user.type(screen.getByLabelText("Contenu"), "Texte historique");
    await user.tab();
    expect(store.getState().past).toHaveLength(1);
    await user.type(screen.getByLabelText("Consigne"), "حلل الوثيقة");
    await user.type(screen.getByLabelText("Titre"), "Archive");
    await user.type(screen.getByLabelText("Source"), "Bibliothèque");
    await user.type(screen.getByLabelText("Référence"), "DOC-42");
    await user.click(
      screen.getByRole("checkbox", {
        name: "Afficher le document dans un cadre",
      }),
    );

    expect(currentBlock(store)).toMatchObject({
      type: "text-document",
      startsNewQuestion: false,
      instruction: "حلل الوثيقة",
      title: "Archive",
      content: "Texte historique",
      source: "Bibliothèque",
      reference: "DOC-42",
      bordered: true,
    });
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
  });

  it("adds, edits, reorders, removes, undoes and redoes Definition items", async () => {
    const user = userEvent.setup();
    const block: DefinitionBlock = {
      id: "definition",
      type: "definition",
      startsNewQuestion: true,
      order: 0,
      items: [{ id: "term-1", term: "Indépendance", answerLines: 2 }],
    };
    const store = renderEditor(block);

    expect(
      screen.getByRole("button", { name: "Supprimer Terme 1" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Ajouter un terme" }));
    expect(screen.getAllByLabelText("Terme")).toHaveLength(2);
    act(() => store.getState().undo());
    expect(screen.getAllByLabelText("Terme")).toHaveLength(1);
    act(() => store.getState().redo());
    expect(screen.getAllByLabelText("Terme")).toHaveLength(2);
    const terms = screen.getAllByLabelText("Terme");
    await user.type(terms[1]!, "Souveraineté");
    await user.tab();
    expect(store.getState().past).toHaveLength(2);
    fireEvent.change(screen.getAllByLabelText("Nombre de lignes")[1]!, {
      target: { value: "4" },
    });
    fireEvent.change(screen.getAllByLabelText("Points")[2]!, {
      target: { value: "1.5" },
    });
    await user.click(screen.getByRole("button", { name: "Monter Terme 2" }));

    let definition = currentBlock(store);
    expect(definition?.type).toBe("definition");
    if (definition?.type === "definition") {
      expect(definition.items.map((item) => item.term)).toEqual([
        "Souveraineté",
        "Indépendance",
      ]);
      expect(definition.items[0]).toMatchObject({
        answerLines: 4,
        points: 1.5,
      });
      expect(new Set(definition.items.map((item) => item.id)).size).toBe(2);
    }

    act(() => store.getState().undo());
    definition = currentBlock(store);
    if (definition?.type === "definition") {
      expect(definition.items[0]?.term).toBe("Indépendance");
    }
    act(() => store.getState().redo());
    await user.click(screen.getByRole("button", { name: "Supprimer Terme 2" }));
    expect((currentBlock(store) as DefinitionBlock).items).toHaveLength(1);
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
  });

  it("manages TrueFalse statements without storing answer correctness", async () => {
    const user = userEvent.setup();
    const block: TrueFalseBlock = {
      id: "true-false",
      type: "true-false",
      startsNewQuestion: true,
      order: 0,
      statements: [],
    };
    const store = renderEditor(block);

    await user.type(screen.getByLabelText("Consigne"), "Cochez la réponse");
    await user.click(
      screen.getByRole("button", { name: "Ajouter une affirmation" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ajouter une affirmation" }),
    );
    const statements = screen.getAllByLabelText("Affirmation");
    await user.type(statements[0]!, "Le Maroc est indépendant.");
    await user.type(statements[1]!, "الرباط عاصمة المغرب.");
    fireEvent.change(screen.getAllByLabelText("Points")[1]!, {
      target: { value: "0.5" },
    });
    await user.click(
      screen.getByRole("button", { name: "Monter Affirmation 2" }),
    );

    const value = currentBlock(store) as TrueFalseBlock;
    expect(value.statements.map((statement) => statement.text)).toEqual([
      "الرباط عاصمة المغرب.",
      "Le Maroc est indépendant.",
    ]);
    expect(value.instruction).toBe("Cochez la réponse");
    expect(JSON.stringify(value)).not.toMatch(/correct|answer/i);
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
    await user.click(
      screen.getByRole("button", { name: "Supprimer Affirmation 2" }),
    );
    expect((currentBlock(store) as TrueFalseBlock).statements).toHaveLength(1);
  });

  it("manages MCQ options and multiple-answer presentation without an answer key", async () => {
    const user = userEvent.setup();
    const block: MultipleChoiceBlock = {
      id: "mcq",
      type: "multiple-choice",
      startsNewQuestion: true,
      order: 0,
      question: "",
      options: [{ id: "option-1", text: "" }],
    };
    const store = renderEditor(block);

    expect(
      screen.getByRole("button", { name: "Supprimer Choix 1" }),
    ).toBeDisabled();
    await user.type(screen.getByLabelText("Question"), "Choisissez");
    await user.click(screen.getByRole("button", { name: "Ajouter un choix" }));
    const options = screen.getAllByLabelText("Texte du choix");
    await user.type(options[0]!, "Rabat");
    await user.type(options[1]!, "الرباط");
    await user.click(
      screen.getByRole("checkbox", { name: "Autoriser plusieurs réponses" }),
    );
    await user.click(screen.getByRole("button", { name: "Monter Choix 2" }));

    const value = currentBlock(store) as MultipleChoiceBlock;
    expect(value.options.map((option) => option.text)).toEqual([
      "الرباط",
      "Rabat",
    ]);
    expect(value.allowMultipleAnswers).toBe(true);
    expect(JSON.stringify(value)).not.toMatch(/correct|isCorrect/i);
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
    await user.click(screen.getByRole("button", { name: "Supprimer Choix 2" }));
    expect((currentBlock(store) as MultipleChoiceBlock).options).toHaveLength(
      1,
    );
    expect(
      screen.getByRole("button", { name: "Supprimer Choix 1" }),
    ).toBeDisabled();
  });

  it("builds FillBlank as ordered typed segments with stable blank IDs", async () => {
    const user = userEvent.setup();
    const block: FillBlankBlock = {
      id: "fill",
      type: "fill-blank",
      startsNewQuestion: true,
      order: 0,
      segments: [],
    };
    const store = renderEditor(block);

    await user.click(screen.getByRole("button", { name: "Ajouter du texte" }));
    await user.click(screen.getByRole("button", { name: "Ajouter un espace" }));
    await user.click(screen.getByRole("button", { name: "Ajouter du texte" }));
    await user.click(screen.getByRole("button", { name: "Ajouter un espace" }));
    await user.type(screen.getAllByLabelText("Texte")[0]!, "En ");
    await user.type(screen.getAllByLabelText("Texte")[1]!, ", le Maroc…");
    fireEvent.change(screen.getAllByLabelText("Largeur de l’espace")[0]!, {
      target: { value: "6" },
    });
    fireEvent.change(screen.getAllByLabelText("Largeur de l’espace")[1]!, {
      target: { value: "8" },
    });

    const beforeMove = currentBlock(store) as FillBlankBlock;
    expect(beforeMove.segments.map((segment) => segment.type)).toEqual([
      "text",
      "blank",
      "text",
      "blank",
    ]);
    const blankIds = beforeMove.segments.flatMap((segment) =>
      segment.type === "blank" ? [segment.id] : [],
    );
    expect(new Set(blankIds).size).toBe(2);
    await user.click(screen.getByRole("button", { name: "Monter Segment 2" }));
    await user.click(
      screen.getByRole("button", { name: "Supprimer Segment 3" }),
    );
    const value = currentBlock(store) as FillBlankBlock;

    expect(value.segments.map((segment) => segment.type)).toEqual([
      "blank",
      "text",
      "blank",
    ]);
    expect(
      value.segments.flatMap((segment) =>
        segment.type === "blank" ? [segment.id] : [],
      ),
    ).toEqual(blankIds);
    expect(JSON.stringify(value.segments)).not.toContain(".....");
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);
  });

  it("routes every Domain block type to a functional editor", async () => {
    const store = createExamBuilderStore();
    store
      .getState()
      .initialize(
        createTestExam([
          createTestSection(allBlockExamples, { id: "section" }),
        ]),
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

    for (const block of allBlockExamples) {
      act(() => store.getState().selectBlock(block.id));
      const entry = getBlockCatalogEntry(block.type);
      expect(
        screen.getByRole("heading", {
          name: i18n.t(entry.labelKey),
          level: 3,
        }),
      ).toBeVisible();
    }

    act(() => store.getState().selectBlock("image-1"));
    expect(await screen.findByText(/Image introuvable/)).toBeVisible();
    act(() => store.getState().selectBlock("page-break-1"));
    expect(screen.getByText(/commencer sur une nouvelle page/)).toBeVisible();
  });
});

describe("Core block editor direction", () => {
  it.each([
    [
      {
        id: "document",
        type: "text-document",
        startsNewQuestion: false,
        order: 0,
        content: "Contenu français",
      } satisfies TextDocumentBlock,
      "#text-document-content-document",
    ],
    [
      {
        id: "definition",
        type: "definition",
        startsNewQuestion: true,
        order: 0,
        items: [{ id: "item", term: "مصطلح", answerLines: 2 }],
      } satisfies DefinitionBlock,
      "#definition-term-item",
    ],
    [
      {
        id: "mcq",
        type: "multiple-choice",
        startsNewQuestion: true,
        order: 0,
        question: "Question française",
        options: [{ id: "option", text: "اختيار" }],
      } satisfies MultipleChoiceBlock,
      "#multiple-choice-option-option",
    ],
  ])(
    "keeps mixed pedagogical text automatic in an Arabic interface",
    async (block, selector) => {
      await changeInterfaceLanguage("ar");
      applyDocumentLanguage("ar");
      renderEditor(block);

      expect(document.documentElement).toHaveAttribute("dir", "rtl");
      expect(document.querySelector(selector)).toHaveAttribute("dir", "auto");
    },
  );
});
