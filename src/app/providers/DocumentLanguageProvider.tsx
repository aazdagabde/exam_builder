import { useEffect, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import { applyDocumentLanguage } from "@/i18n/direction";

export function DocumentLanguageProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
  }, [i18n.language, i18n.resolvedLanguage]);

  return children;
}
