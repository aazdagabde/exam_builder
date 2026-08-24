import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const outputDirectory = path.resolve(".qa", "phase15-pdf");

const references = [
  {
    name: "reference-third-year-ar.pdf",
    query: "reference=third-year&lang=ar&ui=ar",
  },
  {
    name: "reference-first-year-ar.pdf",
    query: "reference=first-year&lang=ar&ui=ar",
  },
  {
    name: "reference-all-blocks-fr.pdf",
    query: "reference=generic&lang=fr&ui=fr",
  },
] as const;

test("generates two Arabic reference PDFs and one French PDF without UI", async ({
  page,
}) => {
  await mkdir(outputDirectory, { recursive: true });

  for (const reference of references) {
    await page.goto(`/dev/renderer-reference?${reference.query}`);
    await expect(page.getByText("Renderer QA")).toBeVisible();
    await expect(page.getByTestId("overflow-status")).toContainText(
      "sans overflow",
    );
    await page.emulateMedia({ media: "print" });
    const outputPath = path.join(outputDirectory, reference.name);
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    expect((await stat(outputPath)).size).toBeGreaterThan(10_000);
    await page.emulateMedia({ media: "screen" });
  }
});
