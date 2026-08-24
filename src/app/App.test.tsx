import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "@/app/App";
import { applyDocumentLanguage } from "@/i18n/direction";
import { changeInterfaceLanguage, INTERFACE_LANGUAGE_COOKIE } from "@/i18n";
import { preferencesRepository } from "@/infrastructure/repositories";

beforeEach(async () => {
  window.history.replaceState({}, "", "/");
  document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=fr; Path=/`;
  await preferencesRepository.save({ interfaceLanguage: "fr" });
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

describe("App foundation", () => {
  it("renders the application without errors", async () => {
    render(<App />);

    expect(
      await screen.findByRole(
        "heading",
        { name: "Mes devoirs" },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exam Builder" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("switches the interface from French to Arabic", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole("heading", { name: "Mes devoirs" });

    await user.click(
      screen.getByRole("button", { name: "Changer la langue de l’interface" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "العربية" }));

    expect(
      await screen.findByRole("heading", { name: "فروضي" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "تغيير لغة الواجهة" }),
    ).toHaveTextContent("العربية");
  });

  it("synchronizes the document language and direction", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "Mes devoirs" });

    expect(document.documentElement).toHaveAttribute("lang", "fr");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");

    await act(async () => {
      await changeInterfaceLanguage("ar");
    });

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "ar");
      expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });
  });
});
