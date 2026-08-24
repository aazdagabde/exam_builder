import type { InterfaceLanguage } from "@/i18n/languages";

export const INTERFACE_LANGUAGE_COOKIE = "exam_builder_language";
const COOKIE_MAX_AGE_SECONDS = 31_536_000;

export function parseInterfaceLanguageCookie(
  cookieHeader: string,
): InterfaceLanguage | null {
  const prefix = `${INTERFACE_LANGUAGE_COOKIE}=`;
  for (const part of cookieHeader.split(";")) {
    const cookie = part.trim();
    if (!cookie.startsWith(prefix)) continue;
    const value = decodeURIComponent(cookie.slice(prefix.length));
    return value === "ar" || value === "fr" ? value : null;
  }
  return null;
}

export function readInterfaceLanguageCookie(): InterfaceLanguage | null {
  if (typeof document === "undefined") return null;
  return parseInterfaceLanguageCookie(document.cookie);
}

export function writeInterfaceLanguageCookie(
  language: InterfaceLanguage,
): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${INTERFACE_LANGUAGE_COOKIE}=${language}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure}`;
}
