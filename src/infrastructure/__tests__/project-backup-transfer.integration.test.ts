// @vitest-environment node

import "fake-indexeddb/auto";
import Dexie from "dexie";

import { createEmptyExam, type Exam, type ExamBlock } from "@/domain/exam";
import { getExamImageIds } from "@/features/exam-renderer/assets/renderer-assets";
import { createExamDocx } from "@/features/export-docx/services/create-exam-docx";
import { createProjectBackup } from "@/features/project-backup/export-project-backup";
import { importProjectBackup } from "@/features/project-backup/import-project-backup";
import { prepareProjectImport } from "@/features/project-backup/prepare-project-import";
import { ExamBuilderDatabase } from "@/infrastructure/indexed-db";
import { IndexedDbAssetRepository } from "@/infrastructure/repositories/indexed-db-asset.repository";
import { IndexedDbExamRepository } from "@/infrastructure/repositories/indexed-db-exam.repository";

const TIME = "2026-08-24T12:00:00.000Z";
const PNG_1X1 = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);

function transferExam(): Exam {
  const exam = createEmptyExam({
    id: "transfer-exam",
    now: TIME,
    documentLanguage: "ar",
  });
  const questions: ExamBlock[] = Array.from({ length: 55 }, (_, index) => ({
    id: `question-${index}`,
    type: "question",
    startsNewQuestion: true,
    order: index,
    question: `السؤال ${index + 1}`,
    answerMode: "lines",
    answerLines: 2,
  }));
  const images: ExamBlock[] = Array.from({ length: 5 }, (_, index) => ({
    id: `image-block-${index}`,
    type: "image",
    startsNewQuestion: false,
    order: questions.length + index,
    imageId: `asset-${index}`,
  }));

  return {
    ...exam,
    metadata: {
      ...exam.metadata,
      title: "فرض محروس شامل",
      level: "الثالثة إعدادي",
      subject: "الاجتماعيات",
      academicYear: "2026-2027",
    },
    sections: [
      {
        id: "section-history",
        title: "التاريخ",
        blocks: [...questions, ...images],
      },
    ],
  };
}

describe("complete project transfer between isolated IndexedDB databases", () => {
  const sourceDatabase = new ExamBuilderDatabase("backup-transfer-source");
  const targetDatabase = new ExamBuilderDatabase("backup-transfer-target");

  afterAll(async () => {
    sourceDatabase.close();
    targetDatabase.close();
    await Dexie.delete(sourceDatabase.name);
    await Dexie.delete(targetDatabase.name);
  });

  it("moves a large Exam and five binary assets, then keeps preview and DOCX resolution usable", async () => {
    const sourceExams = new IndexedDbExamRepository(sourceDatabase);
    const sourceAssets = new IndexedDbAssetRepository(sourceDatabase);
    const targetExams = new IndexedDbExamRepository(targetDatabase);
    const targetAssets = new IndexedDbAssetRepository(targetDatabase);
    const exam = transferExam();
    await sourceExams.save(exam);
    for (let index = 0; index < 5; index += 1) {
      const blob = new Blob([PNG_1X1], { type: "image/png" });
      await sourceAssets.save({
        id: `asset-${index}`,
        kind: "image",
        blob,
        mimeType: "image/png",
        fileName: `خريطة-${index}.png`,
        size: blob.size,
        createdAt: TIME,
      });
    }

    const source = await sourceExams.findById(exam.id);
    expect(source).not.toBeNull();
    const backup = await createProjectBackup({
      exam: source!,
      assetRepository: sourceAssets,
      now: () => TIME,
    });
    const prepared = await prepareProjectImport(JSON.stringify(backup));
    let generated = 0;
    const result = await importProjectBackup({
      prepared,
      examRepository: targetExams,
      assetRepository: targetAssets,
      runtime: {
        createId: () => `target-${generated++}`,
        now: () => TIME,
      },
    });

    expect(result.status).toBe("imported");
    if (result.status !== "imported") return;
    expect(result.exam.sections[0]!.blocks).toHaveLength(60);
    expect(getExamImageIds(result.exam)).toEqual(result.importedAssetIds);
    expect(await targetDatabase.assets.count()).toBe(5);

    for (const assetId of result.importedAssetIds) {
      const restored = await targetAssets.findById(assetId);
      expect(restored).not.toBeNull();
      expect([...new Uint8Array(await restored!.blob.arrayBuffer())]).toEqual([
        ...PNG_1X1,
      ]);
    }

    const docx = await createExamDocx({
      exam: result.exam,
      assetResolver: targetAssets,
      imageNormalizer: {
        normalize: async (asset) => ({
          type: "png",
          data: new Uint8Array(await asset.blob.arrayBuffer()),
          widthPx: 1,
          heightPx: 1,
        }),
      },
    });
    expect(docx.unavailableImageCount).toBe(0);
    expect(docx.imageWarnings).toEqual([]);
  });
});
