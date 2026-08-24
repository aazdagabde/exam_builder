import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";

import { DocumentLanguageProvider } from "@/app/providers/DocumentLanguageProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { createEmptyExam, type Exam } from "@/domain/exam";
import { ExamBuilderPage } from "@/features/exam-builder/pages/ExamBuilderPage";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeAssetRepository } from "@/test/fake-asset.repository";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

function createBuilderExam(id: string, title = `Exam ${id}`): Exam {
  const exam = createEmptyExam({
    id,
    now: "2026-08-23T10:00:00.000Z",
    documentLanguage: "ar",
  });
  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title,
      academicYear: "2026-2027",
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
    },
    sections: [
      { id: `${id}-a`, title: "A", subject: "History", blocks: [] },
      { id: `${id}-b`, title: "B", blocks: [] },
      { id: `${id}-c`, title: "C", blocks: [] },
    ],
  };
}

function renderBuilder(
  repository: FakeExamRepository,
  options: { id?: string; withSwitch?: boolean } = {},
) {
  const id = options.id ?? "exam-1";
  return render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={new FakeAssetRepository()}>
        <ExamRepositoryProvider repository={repository}>
          <DocumentLanguageProvider>
            <MemoryRouter initialEntries={[`/exams/${id}/edit`]}>
              <Routes>
                <Route path="/" element={<p>Dashboard destination</p>} />
                <Route
                  path="/exams/:id/edit"
                  element={
                    <>
                      {options.withSwitch ? (
                        <Link to="/exams/exam-2/edit">Switch exam</Link>
                      ) : null}
                      <ExamBuilderPage />
                    </>
                  }
                />
              </Routes>
            </MemoryRouter>
          </DocumentLanguageProvider>
        </ExamRepositoryProvider>
      </AssetRepositoryProvider>
    </I18nextProvider>,
  );
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

describe("ExamBuilderPage", () => {
  it("shows loading while findById is pending", () => {
    renderBuilder(
      new FakeExamRepository([], {
        findById: () => new Promise<Exam | null>(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Chargement du devoir" }),
    ).toBeVisible();
  });

  it("distinguishes not-found from repository errors", async () => {
    renderBuilder(new FakeExamRepository());
    expect(
      await screen.findByRole("heading", { name: "Devoir introuvable" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Retour aux devoirs" }),
    ).toHaveAttribute("href", "/");
  });

  it("shows a load error and retries", async () => {
    let attempt = 0;
    const exam = createBuilderExam("exam-1");
    const repository = new FakeExamRepository([], {
      findById: async () => {
        attempt += 1;
        if (attempt === 1) throw new Error("Read failed");
        return exam;
      },
    });
    const user = userEvent.setup();
    renderBuilder(repository);

    expect(
      await screen.findByRole("heading", {
        name: "Impossible de charger le devoir",
      }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(
      await screen.findByRole("heading", { name: "Exam exam-1" }),
    ).toBeVisible();
    expect(repository.findByIdCalls).toEqual(["exam-1", "exam-1"]);
  });

  it("loads sections, selects the first, and starts saved", async () => {
    const repository = new FakeExamRepository([createBuilderExam("exam-1")]);
    renderBuilder(repository);

    expect(
      await screen.findByRole("heading", { name: "Exam exam-1" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "A" }).closest("li"),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Titre")).toHaveValue("A");
    expect(screen.getByText("Modifications enregistrées")).toBeVisible();
    expect(repository.savedExams).toHaveLength(0);
  });

  it("switches Structure, Editing, and Preview without losing selection", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });
    await user.click(screen.getByRole("button", { name: "B" }));
    const pageCount = document.querySelectorAll(
      ".exam-pages .exam-page",
    ).length;

    const structureTab = screen.getByRole("tab", { name: "Structure" });
    await user.click(structureTab);
    expect(structureTab).toHaveAttribute("aria-selected", "true");

    const previewTab = screen.getByRole("tab", { name: "Aperçu" });
    await user.click(previewTab);
    expect(previewTab).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: "B" }).closest("li"),
    ).toHaveAttribute("aria-current", "true");

    const editorTab = screen.getByRole("tab", { name: "Édition" });
    await user.click(editorTab);
    expect(editorTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Titre")).toHaveValue("B");
    expect(document.querySelectorAll(".exam-pages .exam-page")).toHaveLength(
      pageCount,
    );
  });

  it("keeps the logical panel order in RTL and exposes keyboard tabs", async () => {
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");
    const user = userEvent.setup();
    const view = renderBuilder(
      new FakeExamRepository([createBuilderExam("exam-1")]),
    );
    await screen.findByRole("heading", { name: "Exam exam-1" });

    const workspace = view.container.querySelector(".builder-workspace");
    expect(
      Array.from(workspace?.children ?? []).map((element) => element.id),
    ).toEqual([
      "builder-pane-structure",
      "builder-pane-editor",
      "builder-pane-preview",
    ]);
    expect(document.documentElement).toHaveAttribute("dir", "rtl");

    const editorTab = screen.getByRole("tab", { name: "التحرير" });
    editorTab.focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "المعاينة" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("selects, adds, and edits section fields", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });

    await user.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getByLabelText("Titre")).toHaveValue("B");
    await user.click(
      screen.getByRole("button", { name: "Ajouter une section" }),
    );
    expect(screen.getByLabelText("Titre")).toHaveValue("");

    await user.type(screen.getByLabelText("Titre"), "Custom");
    await user.type(screen.getByLabelText("Matière"), "Civics");
    await user.type(screen.getByLabelText("Points de la section"), "5");

    expect(screen.getByLabelText("Titre")).toHaveValue("Custom");
    expect(screen.getByLabelText("Matière")).toHaveValue("Civics");
    expect(screen.getByLabelText("Points de la section")).toHaveValue(5);
    expect(screen.getByText("Modifications non enregistrées")).toBeVisible();
  });

  it("exposes the points warning and lets the teacher configure document fields", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });

    expect(screen.getByText(/Total calculé : 0 \/ 20/)).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Paramètres du devoir" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Paramètres du devoir" });
    await user.clear(within(dialog).getByLabelText("Total attendu"));
    await user.type(within(dialog).getByLabelText("Total attendu"), "0");
    await user.click(within(dialog).getByLabelText("Numéro"));
    await user.selectOptions(
      within(dialog).getByLabelText("Langue du devoir"),
      "fr",
    );
    await user.click(within(dialog).getByRole("button", { name: "Fermer" }));

    expect(screen.queryByText(/Total calculé/)).not.toBeInTheDocument();
    expect(screen.getByText("Modifications non enregistrées")).toBeVisible();
  });

  it("duplicates a section and keeps its title", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });

    await user.click(screen.getByRole("button", { name: "Dupliquer A" }));

    expect(screen.getAllByRole("button", { name: "A" })).toHaveLength(2);
    expect(screen.getByLabelText("Titre")).toHaveValue("A");
  });

  it("reorders sections through accessible buttons", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });

    await user.click(screen.getByRole("button", { name: "Monter C" }));

    const sectionButtons = within(
      screen.getByRole("list", { name: "Sections du devoir" }),
    )
      .getAllByRole("listitem")
      .map(
        (item) =>
          within(item)
            .getByRole("button", { name: /^(A|B|C)$/ })
            .querySelector("span")?.textContent,
      );
    expect(sectionButtons).toEqual(["A", "C", "B"]);
  });

  it("confirms deletion and selects a deterministic neighbor", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });
    await user.click(screen.getByRole("button", { name: "B" }));

    await user.click(screen.getByRole("button", { name: "Supprimer B" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Supprimer cette section ?")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Supprimer" }));

    expect(screen.queryByRole("button", { name: "B" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Titre")).toHaveValue("C");
  });

  it("enables Undo and Redo around a document edit", async () => {
    const user = userEvent.setup();
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });
    const undo = screen.getByRole("button", {
      name: "Annuler la modification",
    });
    const redo = screen.getByRole("button", {
      name: "Rétablir la modification",
    });
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Renamed" },
    });
    expect(undo).toBeEnabled();
    await user.click(undo);
    expect(screen.getByLabelText("Titre")).toHaveValue("A");
    expect(redo).toBeEnabled();
    await user.click(redo);
    expect(screen.getByLabelText("Titre")).toHaveValue("Renamed");
  });

  it("uses global shortcuts outside fields and preserves native input undo", async () => {
    renderBuilder(new FakeExamRepository([createBuilderExam("exam-1")]));
    await screen.findByRole("heading", { name: "Exam exam-1" });
    const input = screen.getByLabelText("Titre");
    fireEvent.change(input, { target: { value: "Renamed" } });

    fireEvent.keyDown(input, { key: "z", ctrlKey: true });
    expect(input).toHaveValue("Renamed");

    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(input).toHaveValue("A");
    fireEvent.keyDown(window, { key: "z", ctrlKey: true, shiftKey: true });
    expect(input).toHaveValue("Renamed");
  });

  it("shows dirty, saving, and saved across autosave", async () => {
    let resolveSave: (() => void) | undefined;
    const pendingSave = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const repository = new FakeExamRepository([createBuilderExam("exam-1")], {
      save: () => pendingSave,
    });
    renderBuilder(repository);
    await screen.findByText("Modifications enregistrées");

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Autosaved" },
    });
    expect(screen.getByText("Modifications non enregistrées")).toBeVisible();
    await waitFor(
      () => expect(screen.getByText("Enregistrement…")).toBeVisible(),
      { timeout: 1500 },
    );

    await act(async () => resolveSave?.());
    expect(await screen.findByText("Modifications enregistrées")).toBeVisible();
  });

  it("renders Arabic UI in RTL while section content keeps auto direction", async () => {
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");
    renderBuilder(
      new FakeExamRepository([createBuilderExam("exam-1", "Contrôle")]),
    );

    expect(await screen.findByText("تم حفظ التعديلات")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { name: "Contrôle" })).toHaveAttribute(
      "dir",
      "auto",
    );
    expect(screen.getByLabelText("العنوان")).toHaveAttribute("dir", "auto");
  });

  it("recreates the scoped store when the route Exam ID changes", async () => {
    const repository = new FakeExamRepository([
      createBuilderExam("exam-1", "First Exam"),
      createBuilderExam("exam-2", "Second Exam"),
    ]);
    const user = userEvent.setup();
    renderBuilder(repository, { withSwitch: true });
    expect(
      await screen.findByRole("heading", { name: "First Exam" }),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Unsaved A" },
    });

    await user.click(screen.getByRole("link", { name: "Switch exam" }));

    expect(
      await screen.findByRole("heading", { name: "Second Exam" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Titre")).toHaveValue("A");
    expect(screen.queryByDisplayValue("Unsaved A")).not.toBeInTheDocument();
    await waitFor(() => expect(repository.findByIdCalls).toContain("exam-2"));
  });
});
