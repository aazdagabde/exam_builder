import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function createStressBackup() {
  const now = "2026-08-24T12:00:00.000Z";
  const assetIds = Array.from(
    { length: 10 },
    (_, index) => `stress-asset-${index}`,
  );
  const createBlock = (globalOrder: number, order: number) => {
    if (globalOrder % 6 === 5) {
      return {
        id: `stress-image-${globalOrder}`,
        type: "image" as const,
        startsNewQuestion: false,
        order,
        imageId: assetIds[Math.floor(globalOrder / 6)]!,
        title: `Document cartographique ${globalOrder + 1}`,
        alignment: "center" as const,
      };
    }
    return {
      id: `stress-question-${globalOrder}`,
      type: "question" as const,
      startsNewQuestion: true,
      order,
      question: `Question de recette ${globalOrder + 1} : expliquez brièvement le phénomène étudié.`,
      answerMode: "lines" as const,
      answerLines: 2,
      points: 0.5,
    };
  };
  const digest = createHash("sha256").update(png).digest("hex");

  return {
    format: "exam-builder-project",
    backupVersion: 1,
    exportedAt: now,
    exam: {
      schemaVersion: 1,
      id: "stress-exam-v1",
      metadata: {
        title: "Recette 60 blocs",
        academicYear: "2025/2026",
        institution: "Collège de recette",
        level: "Troisième année collège",
        subject: "Histoire-Géographie",
        totalPoints: 25,
      },
      studentFields: {
        showFullName: true,
        showStudentNumber: true,
        showClassName: true,
        showGrade: true,
      },
      sections: Array.from({ length: 3 }, (_, sectionIndex) => ({
        id: `stress-section-${sectionIndex}`,
        title: `Recette de charge ${sectionIndex + 1}`,
        blocks: Array.from({ length: 20 }, (_, order) =>
          createBlock(sectionIndex * 20 + order, order),
        ),
      })),
      settings: {
        documentLanguage: "fr",
        templateId: "moroccan-college-classic",
        showTotalPoints: true,
      },
      createdAt: now,
      updatedAt: now,
    },
    assets: assetIds.map((id, index) => ({
      id,
      mimeType: "image/png",
      fileName: `stress-${index + 1}.png`,
      size: png.byteLength,
      createdAt: now,
      dataBase64: png.toString("base64"),
      sha256: digest,
    })),
  };
}

test("60 blocks and 10 assets remain editable, autosaved and paginated", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const outputDirectory = path.resolve(".qa", "phase15-stress");
  await mkdir(outputDirectory, { recursive: true });
  const backupPath = path.join(outputDirectory, "stress-60-blocks.exam.json");
  await writeFile(backupPath, JSON.stringify(createStressBackup()), "utf8");

  await page.goto("/");
  if ((await page.locator("html").getAttribute("lang")) === "ar") {
    await page
      .getByRole("button", { name: "تغيير لغة الواجهة" })
      .last()
      .click();
    await page.getByRole("menuitem", { name: "Français" }).click();
  }
  const startedAt = Date.now();
  await page
    .getByRole("button", { name: "Importer un projet" })
    .first()
    .click();
  await page.getByLabel("Fichier de projet").setInputFiles(backupPath);
  await expect(
    page.getByText("Recette 60 blocs", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Importer" }).click();
  await expect(
    page.getByRole("heading", { name: "Recette 60 blocs" }),
  ).toBeVisible();
  const importMilliseconds = Date.now() - startedAt;

  const renderedPages = page.locator(".exam-page:not(.exam-page--measurement)");
  await expect(renderedPages.first()).toBeAttached();
  await expect
    .poll(async () => renderedPages.count(), { timeout: 15_000 })
    .toBeGreaterThan(5);
  await expect(
    page.locator('[data-image-status="ready"]').first(),
  ).toHaveAttribute("src", /^blob:/);

  const question = page.getByLabel("Question", { exact: true });
  await question.fill("Question modifiée pendant la recette de charge.");
  await question.blur();
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();
  await page.getByRole("button", { name: "Annuler la modification" }).click();
  await expect(question).not.toHaveValue(
    "Question modifiée pendant la recette de charge.",
  );
  await page.getByRole("button", { name: "Rétablir la modification" }).click();
  await expect(question).toHaveValue(
    "Question modifiée pendant la recette de charge.",
  );
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();

  const pageCount = await renderedPages.count();
  await page.reload();
  await expect(page.getByLabel("Question", { exact: true })).toHaveValue(
    "Question modifiée pendant la recette de charge.",
  );
  await expect(
    page.locator(".exam-page:not(.exam-page--measurement)"),
  ).toHaveCount(pageCount);

  testInfo.annotations.push({
    type: "performance",
    description: `import=${importMilliseconds}ms; pages=${pageCount}; blocks=60; assets=10`,
  });
  await writeFile(
    path.join(outputDirectory, "measurement.json"),
    JSON.stringify(
      { importMilliseconds, pageCount, blocks: 60, assets: 10 },
      null,
      2,
    ),
    "utf8",
  );
});
