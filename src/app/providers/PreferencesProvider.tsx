import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  PreferencesContext,
  type PreferencesContextValue,
  type PreferencesStatus,
} from "@/app/providers/preferences.context";
import type { PreferencesRepository } from "@/domain/repositories/preferences-repository";
import {
  changeInterfaceLanguage,
  defaultInterfaceLanguage,
  readInterfaceLanguageCookie,
  resolveInterfaceLanguage,
  type InterfaceLanguage,
  writeInterfaceLanguageCookie,
} from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";

export function PreferencesProvider({
  repository,
  children,
}: PropsWithChildren<{ repository: PreferencesRepository }>) {
  const [language, setLanguage] = useState<InterfaceLanguage>(
    () => readInterfaceLanguageCookie() ?? defaultInterfaceLanguage,
  );
  const [status, setStatus] = useState<PreferencesStatus>("loading");
  const [error, setError] = useState<"load" | "save" | null>(null);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const cookieLanguage = readInterfaceLanguageCookie();
      try {
        const stored = cookieLanguage ? null : await repository.get();
        const initialLanguage = cookieLanguage
          ? cookieLanguage
          : resolveInterfaceLanguage(
              stored?.interfaceLanguage ?? defaultInterfaceLanguage,
            );
        await changeInterfaceLanguage(initialLanguage);
        applyDocumentLanguage(initialLanguage);
        writeInterfaceLanguageCookie(initialLanguage);
        if (!active) return;
        setLanguage(initialLanguage);
        setStatus("ready");
        if (cookieLanguage || stored === null) {
          await repository.save({ interfaceLanguage: initialLanguage });
        }
      } catch {
        const fallbackLanguage = cookieLanguage ?? defaultInterfaceLanguage;
        try {
          await changeInterfaceLanguage(fallbackLanguage);
        } catch {
          // Bundled translations make this exceptional; retain current i18n.
        }
        if (!active) return;
        applyDocumentLanguage(fallbackLanguage);
        writeInterfaceLanguageCookie(fallbackLanguage);
        setLanguage(fallbackLanguage);
        setError("load");
        setStatus("error");
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [repository]);

  const setInterfaceLanguage = useCallback(
    async (nextLanguage: InterfaceLanguage): Promise<boolean> => {
      if (nextLanguage === language || status === "saving") return true;
      setStatus("saving");
      setError(null);
      await changeInterfaceLanguage(nextLanguage);
      applyDocumentLanguage(nextLanguage);
      writeInterfaceLanguageCookie(nextLanguage);
      setLanguage(nextLanguage);
      try {
        await repository.save({ interfaceLanguage: nextLanguage });
        setStatus("ready");
        return true;
      } catch {
        setError("save");
        setStatus("error");
        return false;
      }
    },
    [language, repository, status],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ language, status, error, setInterfaceLanguage }),
    [error, language, setInterfaceLanguage, status],
  );

  if (status === "loading") {
    return (
      <div
        role="status"
        aria-label="Exam Builder"
        className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground"
      >
        Exam Builder
      </div>
    );
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
