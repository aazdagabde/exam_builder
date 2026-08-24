import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

import { ApplicationErrorBoundary } from "@/app/components/ApplicationErrorBoundary";
import { changeInterfaceLanguage, i18n } from "@/i18n";

function BrokenRoute(): never {
  throw new Error("route failed");
}

describe("ApplicationErrorBoundary", () => {
  it("shows a localized recovery screen instead of a blank page", async () => {
    await changeInterfaceLanguage("fr");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(
      <I18nextProvider i18n={i18n}>
        <ApplicationErrorBoundary>
          <BrokenRoute />
        </ApplicationErrorBoundary>
      </I18nextProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Une erreur inattendue s’est produite.",
    );
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Retour à mes devoirs" }),
    ).toHaveAttribute("href", "/");
    consoleError.mockRestore();
  });
});
