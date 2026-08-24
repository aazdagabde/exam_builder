import { useContext } from "react";

import { PreferencesContext } from "@/app/providers/preferences.context";

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (preferences === null) {
    throw new Error("usePreferences must be used within PreferencesProvider.");
  }
  return preferences;
}
