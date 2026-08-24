import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DocumentLanguageProvider } from "@/app/providers/DocumentLanguageProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import { ExamSchema } from "@/domain/exam";
import type { ExamRepository } from "@/domain/repositories/exam-repository";
import {
  DEFAULT_EXAM_TEMPLATE_ID,
  DEFAULT_LEVELS,
  DEFAULT_SOCIAL_STUDIES_SECTIONS,
  DEFAULT_SOCIAL_STUDIES_SUBJECT,
} from "@/features/exams/constants/new-exam";
import { NewExamPage } from "@/features/exams/pages/NewExamPage";
import { getDefaultAcademicYear } from "@/features/exams/services/academic-year";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

function renderNewExam(repository: ExamRepository) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExamRepositoryProvider repository={repository}>
        <DocumentLanguageProvider>
          <MemoryRouter initialEntries={["/exams/new"]}>
            <Routes>
              <Route path="/" element={<p>Dashboard destination</p>} />
              <Route path="/exams/new" element={<NewExamPage />} />
              <Route
                path="/exams/:id/edit"
                element={<p>Builder destination</p>}
              />
            </Routes>
          </MemoryRouter>
        </DocumentLanguageProvider>
      </ExamRepositoryProvider>
    </I18nextProvider>,
  );
}

async function completeRequiredInformation(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.type(screen.getByLabelText(/Titre du devoir/), "Contrôle n°1");
  await user.selectOptions(screen.getByLabelText(/Niveau/), DEFAULT_LEVELS[2]);
}

async function goToStructure(user: ReturnType<typeof userEvent.setup>) {
  await completeRequiredInformation(user);
  await user.click(screen.getByRole("button", { name: "Continuer" }));
  expect(
    screen.getByRole("heading", { name: "Structure initiale" }),
  ).toBeVisible();
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

describe("NewExamPage", () => {
  it("opens on the Information step", () => {
    renderNewExam(new FakeExamRepository());

    expect(
      screen.getByRole("heading", { name: "Nouveau devoir" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Informations générales" }),
    ).toBeVisible();
    expect(screen.getByText("Informations").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("pre-fills subject, academic year, document language, and template", () => {
    renderNewExam(new FakeExamRepository());

    expect(screen.getByLabelText(/Matière/)).toHaveValue(
      DEFAULT_SOCIAL_STUDIES_SUBJECT,
    );
    expect(screen.getByLabelText(/Année scolaire/)).toHaveValue(
      getDefaultAcademicYear(new Date()),
    );
    expect(screen.getByLabelText("Langue du devoir")).toHaveValue("ar");
    expect(screen.getByLabelText("Modèle")).toHaveValue(
      DEFAULT_EXAM_TEMPLATE_ID,
    );
    expect(screen.getByLabelText(/Niveau/)).toHaveValue("");
  });

  it("shows required errors and stays on Information", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());

    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(screen.getAllByText("Ce champ est obligatoire.")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Informations générales" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByLabelText(/Titre du devoir/)).toHaveFocus(),
    );
  });

  it("validates that a provided duration is positive", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());
    await completeRequiredInformation(user);
    await user.type(screen.getByLabelText("Durée"), "0");

    await user.click(screen.getByRole("button", { name: "Continuer" }));

    expect(
      screen.getByText(
        "La durée doit être un nombre entier de minutes supérieur à zéro.",
      ),
    ).toBeVisible();
  });

  it("continues to Structure when required information is valid", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());

    await goToStructure(user);

    expect(screen.getByText("Structure").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("returns to Information without losing input", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());
    await goToStructure(user);

    await user.click(screen.getByRole("button", { name: "Retour" }));

    expect(screen.getByLabelText(/Titre du devoir/)).toHaveValue(
      "Contrôle n°1",
    );
    expect(screen.getByLabelText(/Niveau/)).toHaveValue(DEFAULT_LEVELS[2]);
  });

  it("starts with the three recommended sections", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());
    await goToStructure(user);

    for (const sectionTitle of DEFAULT_SOCIAL_STUDIES_SECTIONS) {
      expect(screen.getByDisplayValue(sectionTitle)).toBeVisible();
    }
  });

  it("renames a section and preserves the new value", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());
    await goToStructure(user);
    const section = screen.getByDisplayValue(
      DEFAULT_SOCIAL_STUDIES_SECTIONS[0],
    );

    await user.clear(section);
    await user.type(section, "تاريخ المغرب");

    expect(screen.getByDisplayValue("تاريخ المغرب")).toBeVisible();
  });

  it("adds a stable editable section", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());
    await goToStructure(user);

    await user.click(
      screen.getByRole("button", { name: "Ajouter une section" }),
    );

    const newSection = screen.getByRole("textbox", { name: "Section 4" });
    expect(newSection).toHaveValue("");
    expect(newSection).toHaveFocus();
    await user.type(newSection, "Section personnalisée");
    expect(newSection).toHaveValue("Section personnalisée");
  });

  it("removes a section", async () => {
    const user = userEvent.setup();
    renderNewExam(new FakeExamRepository());
    await goToStructure(user);

    await user.click(
      screen.getByRole("button", {
        name: `Supprimer ${DEFAULT_SOCIAL_STUDIES_SECTIONS[0]}`,
      }),
    );

    expect(
      screen.queryByDisplayValue(DEFAULT_SOCIAL_STUDIES_SECTIONS[0]),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("rejects zero sections without saving", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository();
    renderNewExam(repository);
    await goToStructure(user);

    for (const sectionTitle of DEFAULT_SOCIAL_STUDIES_SECTIONS) {
      await user.click(
        screen.getByRole("button", { name: `Supprimer ${sectionTitle}` }),
      );
    }
    await user.click(screen.getByRole("button", { name: "Créer le devoir" }));

    expect(screen.getByText("Ajoutez au moins une section.")).toBeVisible();
    expect(repository.savedExams).toHaveLength(0);
  });

  it("rejects an empty section title without saving", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository();
    renderNewExam(repository);
    await goToStructure(user);

    await user.clear(
      screen.getByDisplayValue(DEFAULT_SOCIAL_STUDIES_SECTIONS[0]),
    );
    await user.click(screen.getByRole("button", { name: "Créer le devoir" }));

    expect(
      screen.getByText("Le titre de cette section est obligatoire."),
    ).toBeVisible();
    expect(repository.savedExams).toHaveLength(0);
  });

  it("saves a valid Exam and navigates to its Builder route", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository();
    renderNewExam(repository);
    await goToStructure(user);

    await user.click(screen.getByRole("button", { name: "Créer le devoir" }));

    expect(await screen.findByText("Builder destination")).toBeVisible();
    expect(repository.savedExams).toHaveLength(1);
    expect(ExamSchema.parse(repository.savedExams[0])).toEqual(
      repository.savedExams[0],
    );
    expect(repository.savedExams[0]?.metadata.title).toBe("Contrôle n°1");
    expect(repository.savedExams[0]?.sections).toHaveLength(3);
  });

  it("keeps all input and stays in place when persistence fails", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository([], {
      save: async () => {
        throw new Error("Save failed");
      },
    });
    renderNewExam(repository);
    await goToStructure(user);
    const firstSection = screen.getByDisplayValue(
      DEFAULT_SOCIAL_STUDIES_SECTIONS[0],
    );
    await user.clear(firstSection);
    await user.type(firstSection, "تاريخ المغرب");

    await user.click(screen.getByRole("button", { name: "Créer le devoir" }));

    expect(
      await screen.findByText(
        "Impossible de créer le devoir. Vos saisies sont conservées ; réessayez.",
      ),
    ).toBeVisible();
    expect(screen.getByDisplayValue("تاريخ المغرب")).toBeVisible();
    expect(screen.queryByText("Builder destination")).not.toBeInTheDocument();
  });

  it("disables submission and ignores a second click while saving", async () => {
    let resolveSave: (() => void) | undefined;
    let saveCalls = 0;
    const pendingSave = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const repository = new FakeExamRepository([], {
      save: async () => {
        saveCalls += 1;
        await pendingSave;
      },
    });
    const user = userEvent.setup();
    renderNewExam(repository);
    await goToStructure(user);
    const createButton = screen.getByRole("button", {
      name: "Créer le devoir",
    });

    await user.click(createButton);

    expect(screen.getByRole("button", { name: "Création…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Création…" }));
    expect(saveCalls).toBe(1);

    resolveSave?.();
    expect(await screen.findByText("Builder destination")).toBeVisible();
  });

  it("cancels to Dashboard without saving", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository();
    renderNewExam(repository);

    await user.type(screen.getByLabelText(/Titre du devoir/), "À abandonner");
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText("Dashboard destination")).toBeVisible();
    expect(repository.savedExams).toHaveLength(0);
  });

  it("keeps French UI while creating an Arabic document", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository();
    renderNewExam(repository);

    expect(screen.getByLabelText("Langue du devoir")).toHaveValue("ar");
    await goToStructure(user);
    await user.click(screen.getByRole("button", { name: "Créer le devoir" }));
    await screen.findByText("Builder destination");

    expect(repository.savedExams[0]?.settings.documentLanguage).toBe("ar");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });

  it("keeps Arabic RTL UI while creating a French document", async () => {
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");
    const repository = new FakeExamRepository();
    const user = userEvent.setup();
    renderNewExam(repository);

    await user.type(screen.getByLabelText(/عنوان الفرض/), "Contrôle n°1");
    await user.selectOptions(
      screen.getByLabelText(/المستوى/),
      DEFAULT_LEVELS[0],
    );
    await user.selectOptions(screen.getByLabelText("لغة الفرض"), "fr");
    await user.click(screen.getByRole("button", { name: "متابعة" }));
    await user.click(screen.getByRole("button", { name: "إنشاء الفرض" }));
    await screen.findByText("Builder destination");

    expect(repository.savedExams[0]?.settings.documentLanguage).toBe("fr");
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });
});
