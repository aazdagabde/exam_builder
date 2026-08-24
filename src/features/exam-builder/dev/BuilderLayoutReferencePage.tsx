import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { changeInterfaceLanguage } from "@/i18n";

export function BuilderLayoutReferencePage() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const language = parameters.get("ui") === "fr" ? "fr" : "ar";
    const requestedFocus = parameters.get("focus") ?? "definition";
    const focus = ["definition", "table", "matching", "image"].includes(
      requestedFocus,
    )
      ? requestedFocus
      : "definition";
    const id = `builder-layout-reference-${language}-${focus}`;
    const requestedPane = parameters.get("pane") ?? "editor";
    const pane = ["structure", "editor", "preview"].includes(requestedPane)
      ? requestedPane
      : "editor";
    const scroll =
      parameters.get("scroll") === "block-editor"
        ? "&qaScroll=block-editor"
        : "";
    void changeInterfaceLanguage(language)
      .then(() => setDestination(`/exams/${id}/edit?qaPane=${pane}${scroll}`))
      .catch(() => setDestination(`/exams/${id}/edit?qaPane=${pane}${scroll}`));
  }, []);

  if (destination) return <Navigate to={destination} replace />;
  return <p role="status">Preparing Builder layout fixture…</p>;
}
