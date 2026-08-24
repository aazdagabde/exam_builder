import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { i18n } from "@/i18n";
import { applyDocumentLanguage } from "@/i18n/direction";
import { examBuilderDatabase } from "@/infrastructure/indexed-db";
import { migratePersistedExamsToLatest } from "@/infrastructure/repositories/indexed-db-exam.repository";
import "@/styles/globals.css";

applyDocumentLanguage(i18n.resolvedLanguage);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}
const applicationRoot = rootElement;

async function bootstrap() {
  try {
    const report = await migratePersistedExamsToLatest(examBuilderDatabase);
    if (import.meta.env.DEV && report.failures.length > 0) {
      console.error(
        "Some persisted Exams could not be migrated.",
        report.failures,
      );
    }
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error("Persisted Exam migration scan failed.", error);
    }
  }

  createRoot(applicationRoot).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
