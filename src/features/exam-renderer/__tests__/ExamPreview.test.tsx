import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";

import { ExamPreview } from "@/features/exam-renderer/components/ExamPreview";
import { calculateFitScale } from "@/features/exam-renderer/components/preview-zoom";
import { createRendererTestExam } from "@/features/exam-renderer/__tests__/renderer.fixtures";
import { changeInterfaceLanguage, i18n } from "@/i18n";
import { FakeAssetRepository } from "@/test/fake-asset.repository";

function renderPreview(repository = new FakeAssetRepository()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExamPreview
        exam={createRendererTestExam("ar")}
        assetResolver={repository}
      />
    </I18nextProvider>,
  );
}

describe("ExamPreview", () => {
  beforeEach(async () => changeInterfaceLanguage("fr"));

  it("offers all zoom levels without changing the page count", async () => {
    const user = userEvent.setup();
    const view = renderPreview();
    const initialPages = view.container.querySelectorAll(
      ".exam-pages .exam-page",
    ).length;
    const zoom = screen.getByRole("combobox", {
      name: "Niveau de zoom de l’aperçu",
    });
    for (const value of ["50", "75", "100", "125", "fit"]) {
      await user.selectOptions(zoom, value);
      expect(
        view.container.querySelectorAll(".exam-pages .exam-page"),
      ).toHaveLength(initialPages);
    }
    expect(screen.getByText(/Page 1 \/ /)).toBeVisible();
  });

  it("calculates a bounded Fit scale from the preview width", () => {
    expect(calculateFitScale(417)).toBeCloseTo(0.475, 2);
    expect(calculateFitScale(10)).toBe(0.35);
    expect(calculateFitScale(5000)).toBe(1.25);
  });

  it("resolves one object URL per image and revokes it on unmount", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    const repository = new FakeAssetRepository([
      {
        id: "image-asset",
        kind: "image",
        blob,
        mimeType: "image/png",
        size: blob.size,
        createdAt: "2026-08-22T12:00:00.000Z",
      },
    ]);
    const createObjectUrl = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:resolved-preview");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL");
    const view = renderPreview(repository);
    await waitFor(() =>
      expect(
        screen.getAllByRole("img", { name: "وثيقة 1" }).length,
      ).toBeGreaterThan(0),
    );
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:resolved-preview");
  });

  it("keeps the preview usable when an image asset is missing", async () => {
    renderPreview();
    await waitFor(() =>
      expect(
        screen.getAllByRole("img", { name: "الصورة غير متوفرة" }).length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByText(/Page 1 \/ /)).toBeVisible();
  });
});
