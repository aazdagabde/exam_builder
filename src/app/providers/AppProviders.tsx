import type { PropsWithChildren } from "react";
import { I18nextProvider } from "react-i18next";

import { DocumentLanguageProvider } from "@/app/providers/DocumentLanguageProvider";
import { AssetRepositoryProvider } from "@/app/providers/AssetRepositoryProvider";
import { ExamRepositoryProvider } from "@/app/providers/ExamRepositoryProvider";
import { PreferencesProvider } from "@/app/providers/PreferencesProvider";
import { i18n } from "@/i18n";
import {
  assetRepository,
  examRepository,
  preferencesRepository,
} from "@/infrastructure/repositories";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <I18nextProvider i18n={i18n}>
      <PreferencesProvider repository={preferencesRepository}>
        <AssetRepositoryProvider repository={assetRepository}>
          <ExamRepositoryProvider repository={examRepository}>
            <DocumentLanguageProvider>{children}</DocumentLanguageProvider>
          </ExamRepositoryProvider>
        </AssetRepositoryProvider>
      </PreferencesProvider>
    </I18nextProvider>
  );
}
