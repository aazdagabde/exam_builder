import {
  INTERFACE_LANGUAGE_COOKIE,
  parseInterfaceLanguageCookie,
  readInterfaceLanguageCookie,
  writeInterfaceLanguageCookie,
} from "@/i18n";

describe("interface language cookie", () => {
  beforeEach(() => {
    document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=; Path=/; Max-Age=0`;
  });

  it("accepts only Arabic and French", () => {
    expect(parseInterfaceLanguageCookie("a=1; exam_builder_language=ar")).toBe(
      "ar",
    );
    expect(parseInterfaceLanguageCookie("exam_builder_language=fr")).toBe("fr");
    expect(parseInterfaceLanguageCookie("exam_builder_language=xx")).toBeNull();
  });

  it("writes a persistent SameSite cookie readable at boot", () => {
    writeInterfaceLanguageCookie("fr");
    expect(readInterfaceLanguageCookie()).toBe("fr");
    expect(document.cookie).toContain("exam_builder_language=fr");
  });
});
