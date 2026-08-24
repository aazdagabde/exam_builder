import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { interfaceLanguages, type InterfaceLanguage } from "@/i18n";
import { usePreferences } from "@/app/providers/usePreferences";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const currentLanguage = preferences.language;

  const selectLanguage = (language: InterfaceLanguage) => {
    void preferences.setInterfaceLanguage(language);
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={preferences.status === "saving"}
            aria-label={t("common.changeLanguage")}
          >
            <Languages aria-hidden="true" />
            <span>{interfaceLanguages[currentLanguage].label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(interfaceLanguages).map(([language, settings]) => (
            <DropdownMenuItem
              key={language}
              lang={language}
              dir={settings.direction}
              onSelect={() => selectLanguage(language as InterfaceLanguage)}
            >
              <span>{settings.label}</span>
              {language === currentLanguage ? (
                <Check className="ms-auto" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {preferences.error ? (
        <p
          role="alert"
          className="absolute end-0 top-full z-40 mt-2 w-64 rounded-md border border-destructive/30 bg-background p-2 text-xs text-destructive shadow-md"
        >
          {t(`settings.preferences.${preferences.error}Error`)}
        </p>
      ) : null}
    </div>
  );
}
