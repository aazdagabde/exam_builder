import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dexie from "dexie";
import { I18nextProvider } from "react-i18next";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";

import { DocumentLanguageProvider } from "@/app/providers/DocumentLanguageProvider";
import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import { DEFAULT_LEVELS } from "@/features/exams/constants/new-exam";
import { DashboardPage } from "@/features/exams/pages/DashboardPage";
import { NewExamPage } from "@/features/exams/pages/NewExamPage";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import { IndexedDbAssetRepository } from "@/infrastructure/repositories/indexed-db-asset.repository";
import { IndexedDbExamRepository } from "@/infrastructure/repositories/indexed-db-exam.repository";

let databaseCounter = 0;

function renderFlow(
  repository: IndexedDbExamRepository,
  assetRepository: IndexedDbAssetRepository,
  initialEntry = "/",
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={assetRepository}>
        <ExamRepositoryProvider repository={repository}>
          <DocumentLanguageProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/exams/new" element={<NewExamPage />} />
                <Route
                  path="/exams/:id/edit"
                  element={
                    <div>
                      <p>Builder destination</p>
                      <Link to="/">Retour au tableau de bord</Link>
                    </div>
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

describe("New Exam IndexedDB flow", () => {
  it("creates, lists, and restores an Exam after remounting", async () => {
    databaseCounter += 1;
    const database = new ExamBuilderDatabase(
      `new-exam-flow-test-${databaseCounter}`,
    );
    const repository = new IndexedDbExamRepository(database);
    const assetRepository = new IndexedDbAssetRepository(database);
    const user = userEvent.setup();
    await changeInterfaceLanguage("fr");
    applyDocumentLanguage("fr");

    try {
      const firstRender = renderFlow(repository, assetRepository);
      const newExamLinks = await screen.findAllByRole("link", {
        name: "Nouveau devoir",
      });
      await user.click(newExamLinks[0]!);
      await user.type(
        screen.getByLabelText(/Titre du devoir/),
        "Contrôle persistant",
      );
      await user.selectOptions(
        screen.getByLabelText(/Niveau/),
        DEFAULT_LEVELS[1],
      );
      await user.click(screen.getByRole("button", { name: "Continuer" }));
      await user.click(screen.getByRole("button", { name: "Créer le devoir" }));

      expect(await screen.findByText("Builder destination")).toBeVisible();
      await user.click(
        screen.getByRole("link", { name: "Retour au tableau de bord" }),
      );
      expect(await screen.findByText("Contrôle persistant")).toBeVisible();

      firstRender.unmount();
      renderFlow(repository, assetRepository);

      expect(await screen.findByText("Contrôle persistant")).toBeVisible();
      await expect(repository.findAll()).resolves.toHaveLength(1);
    } finally {
      database.close();
      await Dexie.delete(database.name);
    }
  });
});
