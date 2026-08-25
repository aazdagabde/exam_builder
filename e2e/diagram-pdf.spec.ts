import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const outputDirectory = path.resolve(".qa", "diagram-pdf");

const cases = [
  { language: "ar", interfaceLanguage: "ar", layout: "one-up" },
  { language: "ar", interfaceLanguage: "fr", layout: "two-up" },
  { language: "fr", interfaceLanguage: "ar", layout: "one-up" },
  { language: "fr", interfaceLanguage: "ar", layout: "two-up" },
] as const;

test("renders the single Diagram fixture as vector one-up and two-up PDFs", async ({
  page,
}) => {
  await mkdir(outputDirectory, { recursive: true });
  for (const scenario of cases) {
    await page.goto(
      `/dev/renderer-reference?reference=diagram&lang=${scenario.language}&ui=${scenario.interfaceLanguage}&printLayout=${scenario.layout}`,
    );
    const host = page.locator('[data-print-qa-host="true"]');
    await expect(host).toHaveAttribute("data-print-qa-ready", "true");

    const source = page.locator(".exam-pages");
    await expect(source.locator(".exam-diagram")).toHaveCount(3);
    await expect(source.locator(".exam-diagram__svg")).toHaveCount(3);
    await expect(
      source.locator(".exam-diagram canvas, .exam-diagram img"),
    ).toHaveCount(0);
    await expect(source.locator(".exam-diagram__nodes rect")).toHaveCount(10);
    await expect(source.locator(".exam-diagram__edges path")).toHaveCount(7);
    await expect(source.locator(".exam-diagram marker")).toHaveCount(3);
    const markerIds = await source
      .locator(".exam-diagram marker")
      .evaluateAll((markers) => markers.map((marker) => marker.id));
    expect(new Set(markerIds).size).toBe(3);
    await expect(source.locator(".exam-diagram__edges text")).toHaveCount(2);
    await expect(
      source
        .getByText(scenario.language === "ar" ? "الإنتاج" : "Production", {
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      source.locator('[data-diagram-layout="horizontal-flow"] svg'),
    ).toHaveAttribute("data-document-language", scenario.language);
    await expect(
      page.locator("[data-print-imposition] .exam-diagram__svg"),
    ).toHaveCount(3);

    await page.emulateMedia({ media: "print" });
    const outputPath = path.join(
      outputDirectory,
      `diagram-${scenario.language}-${scenario.layout}.pdf`,
    );
    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true,
    });
    expect((await stat(outputPath)).size).toBeGreaterThan(10_000);
    await page.emulateMedia({ media: "screen" });
  }
});
