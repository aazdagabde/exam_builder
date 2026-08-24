import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const outputDirectory = path.resolve(".qa", "pdf-imposition");

const cases = [
  {
    name: "ar-reference-2-pages-one-up.pdf",
    query: "reference=third-year&lang=ar&ui=ar&printLayout=one-up",
    logicalPages: 2,
    physicalSheets: 2,
    orientation: "portrait",
  },
  {
    name: "ar-reference-2-pages-two-up.pdf",
    query: "reference=third-year&lang=ar&ui=ar&printLayout=two-up&scale=1.25",
    logicalPages: 2,
    physicalSheets: 1,
    orientation: "landscape",
  },
  {
    name: "fr-reference-4-pages-one-up.pdf",
    query: "reference=generic&lang=fr&ui=fr&printLayout=one-up&scale=0.5",
    logicalPages: 4,
    physicalSheets: 4,
    orientation: "portrait",
  },
  {
    name: "fr-reference-4-pages-two-up.pdf",
    query: "reference=generic&lang=fr&ui=fr&printLayout=two-up",
    logicalPages: 4,
    physicalSheets: 2,
    orientation: "landscape",
  },
  {
    name: "ar-odd-3-pages-one-up.pdf",
    query: "reference=generic&lang=ar&ui=ar&printLayout=one-up&printPages=3",
    logicalPages: 3,
    physicalSheets: 3,
    orientation: "portrait",
  },
  {
    name: "ar-odd-3-pages-two-up.pdf",
    query: "reference=generic&lang=ar&ui=ar&printLayout=two-up&printPages=3",
    logicalPages: 3,
    physicalSheets: 2,
    orientation: "landscape",
  },
] as const;

test("generates deterministic one-up and two-up physical sheets", async ({
  page,
}) => {
  await mkdir(outputDirectory, { recursive: true });

  for (const scenario of cases) {
    await page.goto(`/dev/renderer-reference?${scenario.query}`);
    const host = page.locator('[data-print-qa-host="true"]');
    await expect(host).toHaveAttribute("data-print-qa-ready", "true");
    await expect(host).toHaveAttribute(
      "data-logical-page-count",
      String(scenario.logicalPages),
    );
    await expect(host).toHaveAttribute(
      "data-physical-sheet-count",
      String(scenario.physicalSheets),
    );
    await expect(page.locator(".print-sheet")).toHaveCount(
      scenario.physicalSheets,
    );

    const sourceContent = await page
      .locator('.exam-pages .exam-page[data-page-number="1"]')
      .first()
      .evaluate((element) => element.innerHTML);
    const imposedContent = await page
      .locator('.print-logical-page[data-logical-page-number="1"]')
      .evaluate((element) => element.innerHTML);
    expect(imposedContent).toBe(sourceContent);

    if (
      scenario.query.includes("lang=ar") &&
      scenario.query.includes("two-up")
    ) {
      const firstSlots = page
        .locator(".print-sheet")
        .first()
        .locator(".print-slot");
      await expect(firstSlots.nth(0)).toHaveAttribute(
        "data-physical-position",
        "right",
      );
      await expect(firstSlots.nth(1)).toHaveAttribute(
        "data-physical-position",
        "left",
      );
    }
    if (scenario.logicalPages === 3 && scenario.orientation === "landscape") {
      await expect(
        page.locator(".print-sheet").last().locator(".print-slot--empty"),
      ).toHaveCount(1);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.emulateMedia({ media: "print" });
    const outputPath = path.join(outputDirectory, scenario.name);
    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true,
    });
    expect((await stat(outputPath)).size).toBeGreaterThan(10_000);
    await page.emulateMedia({ media: "screen" });
  }
});
