import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

interface LayoutReport {
  viewport: { width: number; height: number };
  document: {
    clientWidth: number;
    scrollWidth: number;
    clientHeight: number;
    scrollHeight: number;
  };
  panels: Record<string, { display: string; width: number; height: number }>;
  pageCount: number;
}

const cases = [
  { width: 390, height: 844, language: "ar" },
  { width: 1024, height: 768, language: "ar" },
  { width: 1366, height: 768, language: "ar" },
  { width: 1536, height: 864, language: "ar" },
  { width: 1728, height: 900, language: "ar" },
  { width: 1920, height: 1080, language: "ar" },
  { width: 390, height: 844, language: "fr" },
  { width: 1024, height: 768, language: "fr" },
  { width: 1366, height: 768, language: "fr" },
  { width: 1536, height: 864, language: "fr" },
  { width: 1728, height: 900, language: "fr" },
  { width: 1920, height: 1080, language: "fr" },
] as const;

test("Builder has no global overflow across certified FR/AR desktop viewports", async ({
  page,
}) => {
  const outputDirectory = path.resolve(".qa", "phase15-builder");
  await mkdir(outputDirectory, { recursive: true });
  const reports: Array<LayoutReport & { language: string }> = [];

  for (const current of cases) {
    await page.setViewportSize({
      width: current.width,
      height: current.height,
    });
    await page.goto(
      `/dev/builder-layout-reference?ui=${current.language}&focus=definition&pane=editor`,
    );
    await expect(page).toHaveURL(/\/exams\/builder-layout-reference-/);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      current.language === "ar" ? "rtl" : "ltr",
    );
    await expect
      .poll(async () => page.locator("#builder-layout-report").textContent(), {
        timeout: 10_000,
      })
      .not.toBe("measuring");

    const report = JSON.parse(
      (await page.locator("#builder-layout-report").textContent())!,
    ) as LayoutReport;
    expect(report.viewport).toEqual({
      width: current.width,
      height: current.height,
    });
    expect(report.document.scrollWidth).toBe(report.document.clientWidth);
    expect(report.document.scrollHeight).toBe(report.document.clientHeight);
    expect(report.pageCount).toBeGreaterThan(1);
    if (current.width >= 1024) {
      expect(report.panels.structure.width).toBeGreaterThanOrEqual(240);
      expect(report.panels.editor.width).toBeGreaterThanOrEqual(430);
    } else {
      expect(report.panels.structure.display).toBe("none");
      expect(report.panels.editor.width).toBeGreaterThanOrEqual(350);
    }
    if (current.width >= 1600) {
      expect(report.panels.preview.width).toBeGreaterThanOrEqual(560);
    }

    reports.push({ ...report, language: current.language });
    await page.screenshot({
      path: path.join(
        outputDirectory,
        `${current.language}-${current.width}x${current.height}.png`,
      ),
    });
  }

  await writeFile(
    path.join(outputDirectory, "measurements.json"),
    JSON.stringify(reports, null, 2),
    "utf8",
  );
});
