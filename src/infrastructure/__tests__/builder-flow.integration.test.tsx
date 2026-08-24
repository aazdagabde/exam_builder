import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dexie from "dexie";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DocumentLanguageProvider } from "@/app/providers/DocumentLanguageProvider";
import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import { createEmptyExam, type Exam } from "@/domain/exam";
import type { ImageAssetRecord } from "@/domain/assets";
import { ExamBuilderPage } from "@/features/exam-builder/pages/ExamBuilderPage";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import { IndexedDbExamRepository } from "@/infrastructure/repositories/indexed-db-exam.repository";
import { IndexedDbAssetRepository } from "@/infrastructure/repositories/indexed-db-asset.repository";

let databaseCounter = 0;

function createExam(): Exam {
  const exam = createEmptyExam({
    id: "builder-integration",
    now: "2026-08-23T10:00:00.000Z",
    documentLanguage: "ar",
  });
  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title: "Persistent Builder Exam",
      academicYear: "2026-2027",
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
    },
    sections: [{ id: "history", title: "History", blocks: [] }],
  };
}

function createCoreBlockExam(): Exam {
  const exam = createExam();
  return {
    ...exam,
    sections: [
      {
        id: "history",
        title: "History",
        blocks: [
          {
            id: "instruction",
            type: "instruction",
            startsNewQuestion: false,
            order: 0,
            content: "Initial instruction",
          },
          {
            id: "document",
            type: "text-document",
            startsNewQuestion: false,
            order: 1,
            content: "Initial document",
          },
          {
            id: "mcq",
            type: "multiple-choice",
            startsNewQuestion: true,
            order: 2,
            question: "Choose a city",
            options: [{ id: "option", text: "Initial option" }],
          },
        ],
      },
    ],
  };
}

function createAdvancedExam(): Exam {
  const exam = createExam();
  return {
    ...exam,
    sections: [
      {
        id: "history",
        title: "History",
        blocks: [
          {
            id: "essay",
            type: "essay",
            startsNewQuestion: true,
            order: 0,
            instruction: "Initial essay",
            topics: [],
          },
          {
            id: "image",
            type: "image",
            startsNewQuestion: false,
            order: 1,
            imageId: "asset-original",
            alignment: "center",
          },
        ],
      },
    ],
  };
}

async function originalAsset(): Promise<ImageAssetRecord> {
  const blob = await new Response("original", {
    headers: { "content-type": "image/png" },
  }).blob();
  return {
    id: "asset-original",
    kind: "image",
    blob,
    mimeType: "image/png",
    fileName: "original.png",
    size: blob.size,
    createdAt: "2026-08-22T12:00:00.000Z",
  };
}

function renderPersistedBuilder(
  repository: IndexedDbExamRepository,
  assetRepository: IndexedDbAssetRepository,
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AssetRepositoryProvider repository={assetRepository}>
        <ExamRepositoryProvider repository={repository}>
          <DocumentLanguageProvider>
            <MemoryRouter initialEntries={["/exams/builder-integration/edit"]}>
              <Routes>
                <Route path="/exams/:id/edit" element={<ExamBuilderPage />} />
              </Routes>
            </MemoryRouter>
          </DocumentLanguageProvider>
        </ExamRepositoryProvider>
      </AssetRepositoryProvider>
    </I18nextProvider>,
  );
}

describe("Builder IndexedDB flow", () => {
  it("autosaves section and block changes and restores them after reopening", async () => {
    databaseCounter += 1;
    const database = new ExamBuilderDatabase(
      `builder-flow-test-${databaseCounter}`,
    );
    const repository = new IndexedDbExamRepository(database);
    const assetRepository = new IndexedDbAssetRepository(database);
    await changeInterfaceLanguage("fr");
    applyDocumentLanguage("fr");
    await repository.save(createExam());
    const user = userEvent.setup();

    try {
      const firstView = renderPersistedBuilder(repository, assetRepository);
      await screen.findByRole("heading", { name: "Persistent Builder Exam" });
      fireEvent.change(screen.getByLabelText("Titre"), {
        target: { value: "Moroccan History" },
      });
      await user.click(
        screen.getByRole("button", { name: "Ajouter une section" }),
      );
      await user.type(screen.getByLabelText("Titre"), "Citizenship");
      await user.click(
        screen.getByRole("button", { name: "Ajouter un élément" }),
      );
      await user.click(screen.getByRole("button", { name: "Question" }));
      await user.type(
        screen.getByLabelText("Question"),
        "Why is citizenship important?",
      );

      await waitFor(
        async () => {
          const persisted = await repository.findById("builder-integration");
          expect(persisted?.sections.map((section) => section.title)).toEqual([
            "Moroccan History",
            "Citizenship",
          ]);
          expect(persisted?.sections[1]?.blocks[0]).toMatchObject({
            type: "question",
            startsNewQuestion: true,
            question: "Why is citizenship important?",
            answerMode: "lines",
            answerLines: 3,
          });
        },
        { timeout: 2500 },
      );

      firstView.unmount();
      renderPersistedBuilder(repository, assetRepository);

      expect(await screen.findByDisplayValue("Moroccan History")).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Citizenship" }));
      expect(screen.getByLabelText("Titre")).toHaveValue("Citizenship");
      expect(screen.getByLabelText("Question")).toHaveValue(
        "Why is citizenship important?",
      );
    } finally {
      database.close();
      await Dexie.delete(database.name);
    }
  }, 20_000);

  it("autosaves core editor fields and restores them after reopening", async () => {
    databaseCounter += 1;
    const database = new ExamBuilderDatabase(
      `builder-core-blocks-test-${databaseCounter}`,
    );
    const repository = new IndexedDbExamRepository(database);
    const assetRepository = new IndexedDbAssetRepository(database);
    await changeInterfaceLanguage("fr");
    applyDocumentLanguage("fr");
    await repository.save(createCoreBlockExam());
    const user = userEvent.setup();

    try {
      const firstView = renderPersistedBuilder(repository, assetRepository);
      await screen.findByRole("heading", { name: "Persistent Builder Exam" });
      fireEvent.change(screen.getByLabelText("Consigne"), {
        target: { value: "Instruction sauvegardée" },
      });
      await user.click(screen.getByText("Document texte").closest("button")!);
      fireEvent.change(screen.getByLabelText("Contenu"), {
        target: { value: "Document sauvegardé" },
      });
      const mcqLabel = screen.getByText("Choix multiple");
      await user.click(mcqLabel.closest("button")!);
      fireEvent.change(screen.getByLabelText("Texte du choix"), {
        target: { value: "Rabat" },
      });
      await user.click(
        screen.getByRole("button", { name: "Ajouter un choix" }),
      );
      fireEvent.change(screen.getAllByLabelText("Texte du choix")[1]!, {
        target: { value: "Casablanca" },
      });
      await user.click(
        screen.getByRole("checkbox", {
          name: "Autoriser plusieurs réponses",
        }),
      );

      await waitFor(
        async () => {
          const persisted = await repository.findById("builder-integration");
          expect(persisted?.sections[0]?.blocks[0]).toMatchObject({
            type: "instruction",
            startsNewQuestion: false,
            content: "Instruction sauvegardée",
          });
          expect(persisted?.sections[0]?.blocks[1]).toMatchObject({
            type: "text-document",
            startsNewQuestion: false,
            content: "Document sauvegardé",
          });
          expect(persisted?.sections[0]?.blocks[2]).toMatchObject({
            type: "multiple-choice",
            startsNewQuestion: true,
            allowMultipleAnswers: true,
            options: [{ id: "option", text: "Rabat" }, { text: "Casablanca" }],
          });
        },
        { timeout: 2500 },
      );

      firstView.unmount();
      renderPersistedBuilder(repository, assetRepository);
      expect(
        await screen.findByDisplayValue("Instruction sauvegardée"),
      ).toBeVisible();
      await user.click(screen.getByText("Document texte").closest("button")!);
      expect(screen.getByDisplayValue("Document sauvegardé")).toBeVisible();
      await user.click(screen.getByText("Choix multiple").closest("button")!);
      expect(screen.getAllByLabelText("Texte du choix")[0]).toHaveValue(
        "Rabat",
      );
      expect(screen.getAllByLabelText("Texte du choix")[1]).toHaveValue(
        "Casablanca",
      );
      expect(
        screen.getByRole("checkbox", {
          name: "Autoriser plusieurs réponses",
        }),
      ).toBeChecked();
    } finally {
      database.close();
      await Dexie.delete(database.name);
    }
  }, 10_000);

  it("autosaves Essay and real Image assets across reopening", async () => {
    databaseCounter += 1;
    const database = new ExamBuilderDatabase(
      `builder-advanced-blocks-test-${databaseCounter}`,
    );
    const repository = new IndexedDbExamRepository(database);
    const assetRepository = new IndexedDbAssetRepository(database);
    await changeInterfaceLanguage("fr");
    applyDocumentLanguage("fr");
    await repository.save(createAdvancedExam());
    await assetRepository.save(await originalAsset());
    await expect(
      assetRepository.findById("asset-original"),
    ).resolves.toMatchObject({
      id: "asset-original",
    });
    const user = userEvent.setup();

    try {
      const firstView = renderPersistedBuilder(repository, assetRepository);
      await screen.findByRole("heading", { name: "Persistent Builder Exam" });
      fireEvent.change(screen.getByLabelText("Contexte"), {
        target: { value: "Contexte sauvegardé" },
      });
      await user.click(screen.getByText("Image / document").closest("button")!);
      await waitFor(() => {
        expect(
          screen.queryByText("Chargement de l’image…"),
        ).not.toBeInTheDocument();
      });
      expect(screen.queryByText(/Image introuvable/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Impossible de charger cette image/),
      ).not.toBeInTheDocument();
      await screen.findByRole("img", { name: "Aperçu de l’image" });
      await user.type(
        screen.getByPlaceholderText("Titre facultatif de l’image"),
        "Carte sauvegardée",
      );

      await waitFor(
        async () => {
          const persisted = await repository.findById("builder-integration");
          expect(persisted?.sections[0]?.blocks[0]).toMatchObject({
            type: "essay",
            startsNewQuestion: true,
            context: "Contexte sauvegardé",
          });
          const image = persisted?.sections[0]?.blocks[1];
          expect(image).toMatchObject({
            type: "image",
            startsNewQuestion: false,
            imageId: "asset-original",
            title: "Carte sauvegardée",
          });
          expect(
            await assetRepository.findById("asset-original"),
          ).not.toBeNull();
        },
        { timeout: 2500 },
      );

      firstView.unmount();
      renderPersistedBuilder(repository, assetRepository);
      expect(
        await screen.findByDisplayValue("Contexte sauvegardé"),
      ).toBeVisible();
      await user.click(screen.getByText("Image / document").closest("button")!);
      expect(
        await screen.findByDisplayValue("Carte sauvegardée"),
      ).toBeVisible();
      expect(
        await screen.findByRole("img", { name: "Aperçu de l’image" }),
      ).toBeVisible();
    } finally {
      database.close();
      await Dexie.delete(database.name);
    }
  }, 10_000);
});
