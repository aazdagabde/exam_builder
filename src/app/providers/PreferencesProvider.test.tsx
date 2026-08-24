import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider, useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { PreferencesProvider } from "@/app/providers/PreferencesProvider";
import type { UserPreferences } from "@/domain/preferences";
import type { PreferencesRepository } from "@/domain/repositories/preferences-repository";
import {
  changeInterfaceLanguage,
  INTERFACE_LANGUAGE_COOKIE,
  i18n,
} from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";

class FakePreferencesRepository implements PreferencesRepository {
  saved: UserPreferences[] = [];
  failGet = false;
  failSave = false;

  constructor(public stored: UserPreferences | null = null) {}

  async get() {
    if (this.failGet) throw new Error("read failed");
    return this.stored;
  }

  async save(preferences: UserPreferences) {
    if (this.failSave) throw new Error("save failed");
    this.stored = preferences;
    this.saved.push(preferences);
  }
}

function Probe() {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t("settings.title")}</h1>
      <LanguageSwitcher />
    </>
  );
}

function renderPreferences(repository: PreferencesRepository) {
  return render(
    <I18nextProvider i18n={i18n}>
      <PreferencesProvider repository={repository}>
        <Probe />
      </PreferencesProvider>
    </I18nextProvider>,
  );
}

beforeEach(async () => {
  document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=; Path=/; Max-Age=0`;
  await changeInterfaceLanguage("fr");
  applyDocumentLanguage("fr");
});

describe("PreferencesProvider", () => {
  it("uses Arabic on a first visit and persists both stores", async () => {
    const repository = new FakePreferencesRepository();
    renderPreferences(repository);
    expect(
      await screen.findByRole("heading", { name: "الإعدادات" }),
    ).toBeVisible();
    expect(repository.stored).toEqual({ interfaceLanguage: "ar" });
    expect(document.cookie).toContain("exam_builder_language=ar");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("starts in saved Arabic without rendering a French application first", async () => {
    renderPreferences(
      new FakePreferencesRepository({ interfaceLanguage: "ar" }),
    );

    expect(
      await screen.findByRole("heading", { name: "الإعدادات" }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("persists a language change and restores it after a full remount", async () => {
    const repository = new FakePreferencesRepository({
      interfaceLanguage: "fr",
    });
    const user = userEvent.setup();
    const first = renderPreferences(repository);
    await screen.findByRole("heading", { name: "Paramètres" });

    await user.click(
      screen.getByRole("button", { name: "Changer la langue de l’interface" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "العربية" }));
    expect(
      await screen.findByRole("heading", { name: "الإعدادات" }),
    ).toBeVisible();
    expect(repository.stored).toEqual({ interfaceLanguage: "ar" });

    first.unmount();
    await changeInterfaceLanguage("fr");
    applyDocumentLanguage("fr");
    renderPreferences(repository);
    expect(
      await screen.findByRole("heading", { name: "الإعدادات" }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("keeps the selected session language and reports a persistence failure", async () => {
    const repository = new FakePreferencesRepository({
      interfaceLanguage: "fr",
    });
    repository.failSave = true;
    const user = userEvent.setup();
    renderPreferences(repository);
    await screen.findByRole("heading", { name: "Paramètres" });

    await user.click(
      screen.getByRole("button", { name: "Changer la langue de l’interface" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "العربية" }));

    await waitFor(() => expect(i18n.resolvedLanguage).toBe("ar"));
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(document.cookie).toContain("exam_builder_language=ar");
  });

  it("falls back coherently to Arabic when preferences cannot be read", async () => {
    const repository = new FakePreferencesRepository();
    repository.failGet = true;
    await changeInterfaceLanguage("ar");
    applyDocumentLanguage("ar");

    renderPreferences(repository);

    expect(
      await screen.findByRole("heading", { name: "الإعدادات" }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  it("gives a valid cookie priority and synchronizes IndexedDB", async () => {
    document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=ar; Path=/`;
    const repository = new FakePreferencesRepository({
      interfaceLanguage: "fr",
    });
    renderPreferences(repository);
    expect(
      await screen.findByRole("heading", { name: "الإعدادات" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(repository.stored).toEqual({ interfaceLanguage: "ar" }),
    );
  });

  it("ignores an invalid cookie and falls back to IndexedDB", async () => {
    document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=xx; Path=/`;
    renderPreferences(
      new FakePreferencesRepository({ interfaceLanguage: "fr" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Paramètres" }),
    ).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(document.cookie).toContain("exam_builder_language=fr");
  });
});
