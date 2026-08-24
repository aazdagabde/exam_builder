import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/app/components/LanguageSwitcher";
import { PageHeader } from "@/app/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("settings.interfaceLanguage")}</CardTitle>
          <CardDescription>
            {t("settings.interfaceLanguageHelp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("settings.localStorageNotice")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
