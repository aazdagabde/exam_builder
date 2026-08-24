import { createContext } from "react";

import type { InterfaceLanguage } from "@/i18n";

export type PreferencesStatus = "loading" | "ready" | "saving" | "error";

export interface PreferencesContextValue {
  language: InterfaceLanguage;
  status: PreferencesStatus;
  error: "load" | "save" | null;
  setInterfaceLanguage(language: InterfaceLanguage): Promise<boolean>;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);
