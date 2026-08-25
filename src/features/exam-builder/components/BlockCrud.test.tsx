import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { ExamSchema, type Exam, type QuestionBlock } from "@/domain/exam";
import {
  createTestExam,
  createTestSection,
} from "@/domain/exam/__tests__/exam.fixtures";
import { SectionEditor } from "@/features/exam-builder/components/SectionEditor";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

function question(id = "question-1", order = 0): QuestionBlock {
  return {
    id,
    type: "question",
    startsNewQuestion: true,
    order,
    question: "",
    answerMode: "lines",
    answerLines: 3,
  };
}

function renderBlockCrud(exam: Exam) {
  let id = 0;
  let tick = 0;
  const store = createExamBuilderStore({
    createId: () => `generated-${++id}`,
    now: () => `2026-08-24T10:00:${String(++tick).padStart(2, "0")}.000Z`,
  });
  store.getState().initialize(exam);
  render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={new FakeAssetRepository()}>
        <ExamBuilderStoreProvider store={store}>
          <SectionEditor />
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

describe("Block CRUD UI", () => {
  it("offers all 17 block types and opens the complete Question editor", async () => {
    const user = userEvent.setup();
    const store = renderBlockCrud(
      createTestExam([createTestSection([], { id: "section" })]),
    );

    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Ajouter un élément" });
    expect(within(dialog).getAllByRole("button")).toHaveLength(18);
    expect(
      within(dialog).getByRole("button", { name: "Image / document" }),
    ).toBeEnabled();
    await user.click(within(dialog).getByRole("button", { name: "Question" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Question" })).toBeVisible();
    expect(screen.getByLabelText("Question")).toHaveValue("");
    expect(screen.getByLabelText("Mode de réponse")).toHaveValue("lines");
    expect(screen.getByLabelText("Nombre de lignes")).toHaveValue(3);
    expect(store.getState().selectedBlockId).toBe("generated-1");
  });

  it("edits a question, coalesces typing, and keeps the schema valid", async () => {
    const user = userEvent.setup();
    const store = renderBlockCrud(
      createTestExam([
        createTestSection([question()], { id: "section", title: "History" }),
      ]),
    );
    const textarea = screen.getByLabelText("Question");

    await user.type(textarea, "Expliquez les causes");
    await user.tab();
    expect(store.getState().past).toHaveLength(1);
    expect(store.getState().revision).toBe("Expliquez les causes".length);

    const points = screen.getByLabelText("Points");
    await user.type(points, "1.5");
    await user.selectOptions(screen.getByLabelText("Mode de réponse"), "none");

    const block = store.getState().exam?.sections[0]?.blocks[0];
    expect(block).toMatchObject({
      type: "question",
      startsNewQuestion: true,
      question: "Expliquez les causes",
      points: 1.5,
      answerMode: "none",
    });
    if (block?.type === "question") {
      expect(block.answerLines).toBeUndefined();
    }
    expect(ExamSchema.safeParse(store.getState().exam).success).toBe(true);

    await user.selectOptions(screen.getByLabelText("Mode de réponse"), "lines");
    expect(screen.getByLabelText("Nombre de lignes")).toHaveValue(3);
  });

  it("toggles a derived question number through Undo and Redo", async () => {
    const user = userEvent.setup();
    const exam = createTestExam([
      createTestSection([{ ...question(), startsNewQuestion: true }], {
        id: "section",
        title: "History",
      }),
    ]);
    exam.settings.questionNumbering = {
      enabled: true,
      restartPerSection: true,
    };
    const store = renderBlockCrud(exam);
    const checkbox = screen.getByRole("checkbox", {
      name: /Cet élément commence une nouvelle question/,
    });

    expect(screen.getByLabelText("Question 1")).toBeVisible();
    await user.click(checkbox);
    expect(screen.queryByLabelText("Question 1")).not.toBeInTheDocument();
    expect(store.getState()).toMatchObject({
      revision: 1,
      saveStatus: "dirty",
    });

    store.getState().undo();
    expect(store.getState().exam?.sections[0]?.blocks[0]).toMatchObject({
      startsNewQuestion: true,
    });
    store.getState().redo();
    expect(store.getState().exam?.sections[0]?.blocks[0]).toMatchObject({
      startsNewQuestion: false,
    });
  });

  it("shows local validation without storing negative points", () => {
    const store = renderBlockCrud(
      createTestExam([
        createTestSection([question()], { id: "section", title: "History" }),
      ]),
    );

    fireEvent.change(screen.getByLabelText("Points"), {
      target: { value: "-1" },
    });

    expect(
      screen.getByText("Les points doivent être un nombre positif ou nul."),
    ).toBeVisible();
    expect(
      store.getState().exam?.sections[0]?.blocks[0]?.points,
    ).toBeUndefined();
    expect(store.getState().revision).toBe(0);
  });

  it("disables Essay globally when another section already contains one", async () => {
    const user = userEvent.setup();
    renderBlockCrud(
      createTestExam([
        createTestSection([], { id: "active" }),
        createTestSection(
          [
            {
              id: "essay",
              type: "essay",
              startsNewQuestion: true,
              order: 0,
              instruction: "",
              topics: [],
            },
          ],
          { id: "other" },
        ),
      ]),
    );

    await user.click(
      screen.getByRole("button", { name: "Ajouter un élément" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Sujet de rédaction" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByText(
        "Un sujet de rédaction existe déjà dans ce devoir.",
      ),
    ).toBeVisible();
  });

  it("supports accessible moves and confirms deletion", async () => {
    const user = userEvent.setup();
    const store = renderBlockCrud(
      createTestExam([
        createTestSection(
          [
            question(),
            {
              id: "break",
              type: "page-break",
              startsNewQuestion: false,
              order: 1,
            },
          ],
          { id: "section" },
        ),
      ]),
    );

    expect(
      screen.getByRole("button", { name: "Monter Question" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Descendre Saut de page" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Descendre Question" }),
    );
    expect(
      store.getState().exam?.sections[0]?.blocks.map((block) => block.id),
    ).toEqual(["break", "question-1"]);

    await user.click(
      screen.getByRole("button", { name: "Supprimer Saut de page" }),
    );
    const alertDialog = screen.getByRole("alertdialog");
    expect(
      within(alertDialog).getByText("Supprimer cet élément ?"),
    ).toBeVisible();
    await user.click(
      within(alertDialog).getByRole("button", { name: "Supprimer" }),
    );
    expect(store.getState().exam?.sections[0]?.blocks).toHaveLength(1);
  });

  it("renders Arabic controls in RTL while pedagogical text uses auto direction", async () => {
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");
    renderBlockCrud(
      createTestExam([
        createTestSection([{ ...question(), question: "اشرح الأسباب" }], {
          id: "section",
          title: "التاريخ",
        }),
      ]),
    );

    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(screen.getByLabelText("السؤال")).toHaveAttribute("dir", "auto");
    expect(screen.getByRole("button", { name: "إضافة عنصر" })).toBeVisible();
  });
});
