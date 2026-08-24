import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DocumentLanguageProvider } from "@/app/providers/DocumentLanguageProvider";
import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import type { AssetRepository } from "@/domain/repositories/asset-repository";
import { createEmptyExam, ExamMigrationError, type Exam } from "@/domain/exam";
import type { ExamRepository } from "@/domain/repositories/exam-repository";
import { DashboardPage } from "@/features/exams/pages/DashboardPage";
import { formatExamUpdatedAt } from "@/features/exams/services/exam-formatters";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

const UPDATED_AT = "2026-08-22T14:30:00.000Z";

function createDashboardExam(
  id: string,
  options: {
    title?: string;
    level?: string;
    subject?: string;
    documentLanguage?: "ar" | "fr";
    updatedAt?: string;
  } = {},
): Exam {
  const exam = createEmptyExam({
    id,
    now: "2026-08-20T10:00:00.000Z",
    documentLanguage: options.documentLanguage ?? "fr",
  });

  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title: options.title ?? `Exam ${id}`,
      level: options.level ?? "3e année collège",
      subject: options.subject ?? "Histoire-Géographie",
      academicYear: "2026-2027",
    },
    updatedAt: options.updatedAt ?? UPDATED_AT,
  };
}

function renderDashboard(
  repository: ExamRepository,
  assetRepository: AssetRepository = new FakeAssetRepository(),
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={assetRepository}>
        <ExamRepositoryProvider repository={repository}>
          <DocumentLanguageProvider>
            <MemoryRouter initialEntries={["/"]}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route
                  path="/exams/new"
                  element={<p>New exam destination</p>}
                />
                <Route
                  path="/exams/:id/edit"
                  element={<p>Builder destination</p>}
                />
              </Routes>
            </MemoryRouter>
          </DocumentLanguageProvider>
        </ExamRepositoryProvider>
      </AssetRepositoryProvider>
    </I18nextProvider>,
  );
}

async function openExamActions(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
) {
  await user.click(
    screen.getByRole("button", { name: `Actions pour ${title}` }),
  );
}

beforeEach(async () => {
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardPage", () => {
  it("shows a loading state while the repository is pending", () => {
    const repository = new FakeExamRepository([], {
      findAll: () => new Promise<Exam[]>(() => undefined),
    });

    renderDashboard(repository);

    expect(
      screen.getByRole("status", { name: "Chargement de vos devoirs" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Aucun devoir pour le moment"),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state and new Exam navigation", async () => {
    renderDashboard(new FakeExamRepository());

    expect(
      await screen.findByText("Aucun devoir pour le moment"),
    ).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "Nouveau devoir" }),
    ).toHaveLength(2);
  });

  it("renders two Exam cards", async () => {
    const exams = [
      createDashboardExam("exam-1"),
      createDashboardExam("exam-2"),
    ];
    renderDashboard(new FakeExamRepository(exams));

    expect(await screen.findByText("Exam exam-1")).toBeVisible();
    expect(screen.getByText("Exam exam-2")).toBeVisible();
  });

  it("renders metadata and a localized updatedAt date", async () => {
    const exam = createDashboardExam("exam-metadata", {
      title: "Contrôle n°2",
      level: "Troisième année",
      subject: "Histoire",
    });
    renderDashboard(new FakeExamRepository([exam]));

    expect(await screen.findByText("Contrôle n°2")).toBeVisible();
    expect(screen.getByText("Troisième année")).toBeVisible();
    expect(screen.getByText("Histoire")).toBeVisible();
    expect(
      screen.getByText(formatExamUpdatedAt(UPDATED_AT, "fr")),
    ).toBeVisible();
  });

  it("uses a translated fallback for an untitled Exam", async () => {
    const exam = createDashboardExam("exam-untitled", { title: "" });
    renderDashboard(new FakeExamRepository([exam]));

    expect(await screen.findByText("Devoir sans titre")).toBeVisible();
  });

  it("navigates to the Builder route with the Exam ID", async () => {
    const user = userEvent.setup();
    renderDashboard(new FakeExamRepository([createDashboardExam("exam-open")]));

    await user.click(await screen.findByRole("link", { name: "Modifier" }));

    expect(screen.getByText("Builder destination")).toBeVisible();
  });

  it("opens a confirmation dialog before deleting", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository([
      createDashboardExam("exam-delete-dialog"),
    ]);
    renderDashboard(repository);
    await screen.findByText("Exam exam-delete-dialog");

    await openExamActions(user, "Exam exam-delete-dialog");
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));

    expect(screen.getByRole("alertdialog")).toBeVisible();
    expect(screen.getByText("Supprimer ce devoir ?")).toBeVisible();
    expect(repository.deletedIds).toEqual([]);
  });

  it("cancels deletion without calling the repository", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository([
      createDashboardExam("exam-cancel"),
    ]);
    renderDashboard(repository);
    await screen.findByText("Exam exam-cancel");

    await openExamActions(user, "Exam exam-cancel");
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Annuler",
      }),
    );

    expect(repository.deletedIds).toEqual([]);
    expect(screen.getByText("Exam exam-cancel")).toBeVisible();
  });

  it("deletes the Exam after confirmation and updates local state", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository([
      createDashboardExam("exam-confirm"),
    ]);
    renderDashboard(repository);
    await screen.findByText("Exam exam-confirm");

    await openExamActions(user, "Exam exam-confirm");
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Supprimer",
      }),
    );

    await waitFor(() =>
      expect(repository.deletedIds).toEqual(["exam-confirm"]),
    );
    expect(await screen.findByText("Le devoir a été supprimé.")).toBeVisible();
    expect(screen.queryByText("Exam exam-confirm")).not.toBeInTheDocument();
  });

  it("keeps the card and reports an error when deletion fails", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository(
      [createDashboardExam("exam-delete-error")],
      {
        delete: async () => {
          throw new Error("Delete failed");
        },
      },
    );
    renderDashboard(repository);
    await screen.findByText("Exam exam-delete-error");

    await openExamActions(user, "Exam exam-delete-error");
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Supprimer",
      }),
    );

    expect(
      await screen.findByText(
        "Impossible de supprimer le devoir. Il est toujours conservé.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Exam exam-delete-error")).toBeVisible();
  });

  it("duplicates, persists, and immediately displays a new Exam", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository([
      createDashboardExam("exam-duplicate"),
    ]);
    renderDashboard(repository);
    await screen.findByText("Exam exam-duplicate");

    await openExamActions(user, "Exam exam-duplicate");
    await user.click(screen.getByRole("menuitem", { name: "Dupliquer" }));

    expect(await screen.findByText("Le devoir a été dupliqué.")).toBeVisible();
    expect(repository.savedExams).toHaveLength(1);
    expect(repository.savedExams[0]?.id).not.toBe("exam-duplicate");
    expect(screen.getAllByText("Exam exam-duplicate")).toHaveLength(2);
  });

  it("does not add a card when duplication persistence fails", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository(
      [createDashboardExam("exam-duplicate-error")],
      {
        save: async () => {
          throw new Error("Save failed");
        },
      },
    );
    renderDashboard(repository);
    await screen.findByText("Exam exam-duplicate-error");

    await openExamActions(user, "Exam exam-duplicate-error");
    await user.click(screen.getByRole("menuitem", { name: "Dupliquer" }));

    expect(
      await screen.findByText("Impossible de dupliquer le devoir. Réessayez."),
    ).toBeVisible();
    expect(screen.getAllByText("Exam exam-duplicate-error")).toHaveLength(1);
  });

  it("shows an initial load error instead of an empty state", async () => {
    const repository = new FakeExamRepository([], {
      findAll: async () => {
        throw new Error("Load failed");
      },
    });
    renderDashboard(repository);

    expect(
      await screen.findByText("Impossible de charger vos devoirs"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeVisible();
    expect(
      screen.queryByText("Aucun devoir pour le moment"),
    ).not.toBeInTheDocument();
  });

  it("explains that a future Exam schema requires an application update", async () => {
    const repository = new FakeExamRepository([], {
      findAll: async () => {
        throw new ExamMigrationError("UNSUPPORTED_FUTURE_EXAM_SCHEMA", {
          sourceVersion: 999,
        });
      },
    });
    renderDashboard(repository);

    expect(
      await screen.findByText(
        "Un devoir a été créé avec une version plus récente d’Exam Builder. Mettez l’application à jour pour l’ouvrir.",
      ),
    ).toBeVisible();
  });

  it("retries a failed initial load", async () => {
    const exam = createDashboardExam("exam-retry");
    let attempt = 0;
    const repository = new FakeExamRepository([], {
      findAll: async () => {
        attempt += 1;
        if (attempt === 1) {
          throw new Error("First load failed");
        }
        return [exam];
      },
    });
    const user = userEvent.setup();
    renderDashboard(repository);

    await user.click(await screen.findByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Exam exam-retry")).toBeVisible();
    expect(repository.findAllCalls).toBe(2);
  });

  it("exports a complete project from the Exam action menu", async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.spyOn(URL, "createObjectURL");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL");
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    renderDashboard(
      new FakeExamRepository([createDashboardExam("exam-export")]),
    );
    await screen.findByText("Exam exam-export");

    await openExamActions(user, "Exam exam-export");
    await user.click(
      screen.getByRole("menuitem", { name: "Exporter le projet" }),
    );

    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledOnce());
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test-preview");
  });

  it("shows a visible export error and does not download when an image is missing", async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.spyOn(URL, "createObjectURL");
    const exam = {
      ...createDashboardExam("exam-missing-image"),
      sections: [
        {
          id: "section-image",
          title: "Géographie",
          blocks: [
            {
              id: "image-block",
              type: "image" as const,
              startsNewQuestion: false,
              order: 0,
              imageId: "missing-image",
            },
          ],
        },
      ],
    };
    renderDashboard(new FakeExamRepository([exam]));
    await screen.findByText("Exam exam-missing-image");

    await openExamActions(user, "Exam exam-missing-image");
    await user.click(
      screen.getByRole("menuitem", { name: "Exporter le projet" }),
    );

    expect(
      await screen.findByText(
        "Une image utilisée par le devoir manque dans la sauvegarde.",
      ),
    ).toBeVisible();
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it("validates an imported project, shows its summary, then opens it", async () => {
    const user = userEvent.setup();
    const exam = createDashboardExam("imported-exam", {
      title: "Projet transféré",
    });
    renderDashboard(new FakeExamRepository());

    await user.click(
      await screen.findByRole("button", { name: "Importer un projet" }),
    );
    const input = screen.getByLabelText("Fichier de projet");
    await user.upload(
      input,
      new File(
        [
          JSON.stringify({
            format: "exam-builder-project",
            backupVersion: 1,
            exportedAt: UPDATED_AT,
            exam,
            assets: [],
          }),
        ],
        "projet.exam.json",
        { type: "application/json" },
      ),
    );

    expect(await screen.findByText("Projet transféré")).toBeVisible();
    expect(screen.getByText("Version de sauvegarde")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Importer" }));
    expect(await screen.findByText("Builder destination")).toBeVisible();
  });

  it("asks for an explicit copy or replacement when the Exam ID collides", async () => {
    const user = userEvent.setup();
    const exam = createDashboardExam("collision", { title: "Collision" });
    renderDashboard(new FakeExamRepository([exam]));
    await user.click(
      await screen.findByRole("button", { name: "Importer un projet" }),
    );
    await user.upload(
      screen.getByLabelText("Fichier de projet"),
      new File(
        [
          JSON.stringify({
            format: "exam-builder-project",
            backupVersion: 1,
            exportedAt: UPDATED_AT,
            exam,
            assets: [],
          }),
        ],
        "collision.exam.json",
        { type: "application/json" },
      ),
    );

    expect(
      await screen.findByRole("button", { name: "Importer comme copie" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remplacer le devoir local" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies the explicit replacement choice and opens the imported Exam", async () => {
    const user = userEvent.setup();
    const localExam = createDashboardExam("replace-id", { title: "Local" });
    const importedExam = createDashboardExam("replace-id", {
      title: "Sauvegarde",
    });
    const repository = new FakeExamRepository([localExam]);
    renderDashboard(repository);
    await user.click(
      await screen.findByRole("button", { name: "Importer un projet" }),
    );
    await user.upload(
      screen.getByLabelText("Fichier de projet"),
      new File(
        [
          JSON.stringify({
            format: "exam-builder-project",
            backupVersion: 1,
            exportedAt: UPDATED_AT,
            exam: importedExam,
            assets: [],
          }),
        ],
        "replace.exam.json",
        { type: "application/json" },
      ),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Remplacer le devoir local",
      }),
    );

    expect(await screen.findByText("Builder destination")).toBeVisible();
    expect(repository.savedExams.at(-1)?.metadata.title).toBe("Sauvegarde");
  });

  it("reports malformed project JSON without persisting it", async () => {
    const user = userEvent.setup();
    const repository = new FakeExamRepository();
    renderDashboard(repository);
    await user.click(
      await screen.findByRole("button", { name: "Importer un projet" }),
    );
    await user.upload(
      screen.getByLabelText("Fichier de projet"),
      new File(["{"], "broken.exam.json", { type: "application/json" }),
    );

    expect(
      await screen.findByText("Le fichier JSON est illisible ou endommagé."),
    ).toBeVisible();
    expect(repository.savedExams).toEqual([]);
  });

  it("renders Arabic UI in RTL while preserving French content direction", async () => {
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");
    const exam = createDashboardExam("exam-french-content", {
      title: "Contrôle n°2",
      documentLanguage: "fr",
    });
    renderDashboard(new FakeExamRepository([exam]));

    expect(await screen.findByRole("heading", { name: "فروضي" })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(
      screen.getByRole("button", {
        name: i18n.t("projectBackup.import.action"),
      }),
    ).toBeVisible();
    expect(screen.getByText("Contrôle n°2")).toHaveAttribute("dir", "auto");
  });

  it("uses automatic direction for Arabic content in French UI", async () => {
    const exam = createDashboardExam("exam-arabic-content", {
      title: "فرض محروس رقم 2",
      documentLanguage: "ar",
    });
    renderDashboard(new FakeExamRepository([exam]));

    expect(await screen.findByText("فرض محروس رقم 2")).toHaveAttribute(
      "dir",
      "auto",
    );
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
