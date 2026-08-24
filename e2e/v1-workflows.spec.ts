import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function resetLocalDatabase(context: BrowserContext) {
  await context.addInitScript(async () => {
    if (sessionStorage.getItem("exam-builder-e2e-db-ready")) return;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("exam-builder");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
    sessionStorage.setItem("exam-builder-e2e-db-ready", "true");
  });
}

async function ensureFrenchInterface(page: Page) {
  if ((await page.locator("html").getAttribute("lang")) === "ar") {
    await page
      .getByRole("button", { name: "تغيير لغة الواجهة" })
      .last()
      .click();
    await page.getByRole("menuitem", { name: "Français" }).click();
  }
}

async function createFrenchExam(page: Page, title: string) {
  await page.goto("/");
  await ensureFrenchInterface(page);
  await expect(
    page.getByRole("heading", { name: "Mes devoirs" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Nouveau devoir" }).first().click();
  await page.getByLabel(/Titre du devoir/).fill(title);
  await page.getByLabel(/Niveau/).selectOption({ index: 1 });
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(
    page.getByRole("heading", { name: "Structure initiale" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Créer le devoir" }).click();
  await expect(page).toHaveURL(/\/exams\/[^/]+\/edit/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

test.beforeEach(async ({ context }) => {
  await resetLocalDatabase(context);
});

test("FR: create, edit, autosave, reload, preview, PDF readiness and DOCX", async ({
  page,
}) => {
  await createFrenchExam(page, "Recette V1");

  await page.getByRole("button", { name: "Ajouter un élément" }).click();
  await page.getByRole("button", { name: "Question", exact: true }).click();
  await expect(page.getByLabel("Question 1")).toBeVisible();
  await page
    .getByLabel("Question", { exact: true })
    .fill("Expliquez deux causes historiques importantes.");
  await page.getByLabel("Points", { exact: true }).fill("2");
  await page.getByLabel("Question", { exact: true }).blur();
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Question", { exact: true })).toHaveValue(
    "Expliquez deux causes historiques importantes.",
  );

  await page.getByRole("button", { name: "Paramètres du devoir" }).click();
  await page.getByLabel("Total attendu").fill("2");
  await page.getByRole("checkbox", { name: "Numéro", exact: true }).uncheck();
  await page.getByRole("button", { name: "Fermer" }).click();
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();

  await page.getByRole("tab", { name: "Aperçu" }).click();
  await expect(
    page.locator(".exam-page:not(.exam-page--measurement)").first(),
  ).toBeVisible();
  await expect(
    page.locator('.exam-pages [data-question-number="1"]').first(),
  ).toBeVisible();
  await expect(page.getByLabel("Niveau de zoom de l’aperçu")).toBeVisible();

  await page.evaluate(() => {
    Object.defineProperty(window, "print", {
      configurable: true,
      value: () =>
        document.documentElement.setAttribute("data-e2e-print", "ok"),
    });
  });
  await page.getByRole("button", { name: "Exporter PDF" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-e2e-print", "ok");

  const docxDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter Word" }).click();
  const docx = await docxDownload;
  expect(docx.suggestedFilename()).toMatch(/\.docx$/i);
  expect(await docx.path()).not.toBeNull();
});

test("two-up export imposes the current LTR logical page without preview influence", async ({
  page,
}) => {
  await createFrenchExam(page, "Imposition PDF V1");
  await page.getByRole("button", { name: "Ajouter un élément" }).click();
  await page.getByRole("button", { name: "Question", exact: true }).click();
  await expect(page.getByLabel("Question 1")).toBeVisible();
  await page.getByRole("button", { name: "Paramètres du devoir" }).click();
  await page.getByLabel("Langue du devoir").selectOption("fr");
  await page.getByRole("button", { name: "Fermer" }).click();
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();

  await page.getByRole("tab", { name: "Aperçu" }).click();
  const logicalPagesBefore = await page
    .locator(".exam-pages .exam-page[data-page-number]")
    .count();
  await page.getByLabel("Niveau de zoom de l’aperçu").selectOption("125");
  await page.evaluate(() => {
    const reports: Array<Record<string, unknown>> = [];
    Object.assign(window, { __pdfImpositionReports: reports });
    Object.defineProperty(window, "print", {
      configurable: true,
      value: () => {
        const layout = document.querySelector<HTMLElement>(
          "[data-print-imposition]",
        );
        const style = document.head.querySelector<HTMLStyleElement>(
          "[data-print-page-style]",
        );
        reports.push({
          mode: layout?.dataset.printImposition,
          logicalPages: Number(layout?.dataset.logicalPageCount),
          physicalSheets: Number(layout?.dataset.physicalSheetCount),
          positions: [
            ...document.querySelectorAll<HTMLElement>(
              ".print-sheet:first-child .print-slot",
            ),
          ].map((slot) => slot.dataset.physicalPosition),
          emptySlots: layout?.querySelectorAll(".print-slot--empty").length,
          scale: layout
            ?.querySelector<HTMLElement>(".print-page-frame")
            ?.style.getPropertyValue("--print-page-scale"),
          pageStyle: style?.textContent,
        });
      },
    });
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.getByRole("button", { name: "Exporter PDF" }).click();
  await page.getByRole("radio", { name: /Deux pages par feuille/ }).check();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  const report = await page.evaluate(
    () =>
      (
        window as Window & {
          __pdfImpositionReports: Array<Record<string, unknown>>;
        }
      ).__pdfImpositionReports[0],
  );
  expect(report).toMatchObject({
    mode: "two-up",
    logicalPages: logicalPagesBefore,
    physicalSheets: Math.ceil(logicalPagesBefore / 2),
    positions: ["left", "right"],
    emptySlots: logicalPagesBefore % 2,
  });
  expect(report?.scale).toBe(String(144 / 210));
  expect(report?.pageStyle).toContain("size: A4 landscape");
  await expect(page.locator("[data-print-imposition]")).toHaveCount(0);
  await expect(
    page.locator(".exam-pages .exam-page[data-page-number]"),
  ).toHaveCount(logicalPagesBefore);
});

test("first visit is Arabic, then French persists while document language stays independent", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "الإعدادات" })).toBeVisible();
  await page.getByRole("button", { name: "تغيير لغة الواجهة" }).last().click();
  await page.getByRole("menuitem", { name: "Français" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();

  await page.getByRole("link", { name: "Mes devoirs" }).click();
  await page.getByRole("link", { name: "Nouveau devoir" }).first().click();
  await expect(page.getByLabel("Langue du devoir")).toHaveValue("ar");
  await page.getByLabel("Langue du devoir").selectOption("fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("Dashboard duplicate keeps the original exam unchanged", async ({
  page,
}) => {
  await createFrenchExam(page, "Original V1");
  await page.getByRole("link", { name: "Retour aux devoirs" }).click();
  await expect(page.getByText("Original V1", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Actions pour Original V1/ }).click();
  await page.getByRole("menuitem", { name: "Dupliquer" }).click();
  await expect(page.getByText("Le devoir a été dupliqué.")).toBeVisible();
  await expect(page.locator("[data-exam-id]")).toHaveCount(2);
  await expect(page.getByText("Original V1", { exact: true })).toHaveCount(2);
});

test("project backup restores an exam image in an isolated browser database", async ({
  browser,
  page,
}) => {
  await createFrenchExam(page, "Projet portable V1");
  await page.getByRole("button", { name: "Ajouter un élément" }).click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Image / document" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "carte.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page
      .locator(
        '.exam-page:not(.exam-page--measurement) [data-image-status="ready"]',
      )
      .first(),
  ).toHaveAttribute("src", /^blob:/);
  await expect(page.getByText("Modifications enregistrées")).toBeVisible();

  await page.getByRole("link", { name: "Retour aux devoirs" }).click();
  await page
    .getByRole("button", { name: /Actions pour Projet portable V1/ })
    .click();
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Exporter le projet" }).click();
  const backup = await backupDownload;
  const backupDirectory = path.resolve(".qa", "phase15-backup");
  await mkdir(backupDirectory, { recursive: true });
  const backupPath = path.join(
    backupDirectory,
    "portable-with-image.exam.json",
  );
  await backup.saveAs(backupPath);

  const restoredContext = await browser.newContext();
  const restoredPage = await restoredContext.newPage();
  try {
    const origin = new URL(page.url()).origin;
    await restoredPage.goto(origin);
    await ensureFrenchInterface(restoredPage);
    await expect(
      restoredPage.getByRole("heading", { name: "Mes devoirs" }),
    ).toBeVisible();
    await restoredPage
      .getByRole("button", { name: "Importer un projet" })
      .first()
      .click();
    await restoredPage
      .getByLabel("Fichier de projet")
      .setInputFiles(backupPath);
    await expect(
      restoredPage.getByText("Projet portable V1", { exact: true }),
    ).toBeVisible();
    await restoredPage.getByRole("button", { name: "Importer" }).click();
    await expect(restoredPage).toHaveURL(/\/exams\/[^/]+\/edit/);
    await expect(
      restoredPage
        .locator(
          '.exam-page:not(.exam-page--measurement) [data-image-status="ready"]',
        )
        .first(),
    ).toHaveAttribute("src", /^blob:/);

    await restoredPage.evaluate(() => {
      Object.defineProperty(window, "print", {
        configurable: true,
        value: () =>
          document.documentElement.setAttribute("data-e2e-print", "ok"),
      });
    });
    await restoredPage.getByRole("button", { name: "Exporter PDF" }).click();
    await restoredPage.getByRole("button", { name: "Continuer" }).click();
    await expect(restoredPage.locator("html")).toHaveAttribute(
      "data-e2e-print",
      "ok",
    );

    const docxDownload = restoredPage.waitForEvent("download");
    await restoredPage.getByRole("button", { name: "Exporter Word" }).click();
    expect((await docxDownload).suggestedFilename()).toMatch(/\.docx$/i);
  } finally {
    await restoredContext.close();
  }
});
