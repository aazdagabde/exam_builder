import { render, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { createEmptyExam } from "@/domain/exam";
import { BuilderExamPreview } from "@/features/exam-builder/components/BuilderExamPreview";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { createProjectBackup } from "@/features/project-backup/export-project-backup";
import { importProjectBackup } from "@/features/project-backup/import-project-backup";
import { prepareProjectImport } from "@/features/project-backup/prepare-project-import";
import { i18n } from "@/i18n";
import { FakeAssetRepository } from "@/test/fake-asset.repository";
import { FakeExamRepository } from "@/test/fakes/fake-exam-repository";

const TIME = "2026-08-24T12:00:00.000Z";

describe("project backup restored preview", () => {
  it("resolves a remapped imported image through the normal Preview/PDF asset path", async () => {
    const exam = createEmptyExam({
      id: "preview-transfer",
      now: TIME,
      documentLanguage: "ar",
      templateId: "moroccan-college-classic",
    });
    exam.metadata = {
      ...exam.metadata,
      title: "فرض مع صورة",
      academicYear: "2026-2027",
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
    };
    exam.sections = [
      {
        id: "section",
        title: "الجغرافيا",
        blocks: [
          {
            id: "image-block",
            type: "image",
            startsNewQuestion: false,
            order: 0,
            imageId: "source-image",
            title: "خريطة",
            caption: "وثيقة مستوردة",
          },
        ],
      },
    ];
    const blob = new Blob([new Uint8Array([1, 2, 3])], {
      type: "image/png",
    });
    const backup = await createProjectBackup({
      exam,
      assetRepository: new FakeAssetRepository([
        {
          id: "source-image",
          kind: "image",
          blob,
          mimeType: "image/png",
          size: blob.size,
          createdAt: TIME,
        },
      ]),
    });
    const targetAssets = new FakeAssetRepository();
    const result = await importProjectBackup({
      prepared: await prepareProjectImport(JSON.stringify(backup)),
      examRepository: new FakeExamRepository(),
      assetRepository: targetAssets,
      runtime: {
        createId: () => "restored-image",
        now: () => TIME,
      },
    });
    expect(result.status).toBe("imported");
    if (result.status !== "imported") return;
    const store = createExamBuilderStore();
    store.getState().initialize(result.exam);

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <AssetRepositoryProvider repository={targetAssets}>
          <ExamBuilderStoreProvider store={store}>
            <BuilderExamPreview />
          </ExamBuilderStoreProvider>
        </AssetRepositoryProvider>
      </I18nextProvider>,
    );

    await waitFor(() => {
      const images = container.querySelectorAll(
        'img[data-image-status="ready"][data-image-id="restored-image"]',
      );
      expect(images.length).toBeGreaterThan(0);
      expect(images[0]).toHaveAttribute("src", "blob:test-preview");
    });
  });
});
