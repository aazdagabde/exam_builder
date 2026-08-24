import { act, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { createEmptyExam } from "@/domain/exam";
import { BuilderExamPreview } from "@/features/exam-builder/components/BuilderExamPreview";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

describe("BuilderExamPreview", () => {
  it("reads the current in-memory Exam and updates without a repository reload", async () => {
    await changeInterfaceLanguage("fr");
    const store = createExamBuilderStore();
    const exam = createEmptyExam({
      id: "live-preview",
      now: "2026-08-22T12:00:00.000Z",
      documentLanguage: "ar",
      templateId: "moroccan-college-classic",
    });
    exam.metadata.title = "معاينة مباشرة";
    exam.sections = [
      {
        id: "section",
        title: "التاريخ",
        blocks: [
          {
            id: "question",
            type: "question",
            startsNewQuestion: true,
            order: 0,
            question: "السؤال القديم",
            answerMode: "lines",
            answerLines: 3,
          },
        ],
      },
    ];
    store.getState().initialize(exam);

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <AssetRepositoryProvider repository={new FakeAssetRepository()}>
          <ExamBuilderStoreProvider store={store}>
            <BuilderExamPreview />
          </ExamBuilderStoreProvider>
        </AssetRepositoryProvider>
      </I18nextProvider>,
    );
    expect(container.querySelector(".exam-renderer")).toHaveAttribute(
      "dir",
      "rtl",
    );
    expect(screen.getAllByText("السؤال القديم").length).toBeGreaterThan(0);

    act(() => {
      store
        .getState()
        .updateBlock("question", (block) =>
          block.type === "question"
            ? { ...block, question: "السؤال الجديد", answerLines: 5 }
            : block,
        );
    });

    await waitFor(() =>
      expect(screen.getAllByText("السؤال الجديد").length).toBeGreaterThan(0),
    );
    const visibleLines = container.querySelectorAll(
      ".exam-pages .exam-answer-line",
    );
    expect(visibleLines).toHaveLength(5);
  });
});
