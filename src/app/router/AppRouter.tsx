import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/components/AppShell";

const DashboardPage = lazy(() =>
  import("@/features/exams/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const NewExamPage = lazy(() =>
  import("@/features/exams/pages/NewExamPage").then((module) => ({
    default: module.NewExamPage,
  })),
);
const ExamBuilderPage = lazy(() =>
  import("@/features/exam-builder/pages/ExamBuilderPage").then((module) => ({
    default: module.ExamBuilderPage,
  })),
);
const TemplatesPage = lazy(() =>
  import("@/features/templates/pages/TemplatesPage").then((module) => ({
    default: module.TemplatesPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/app/router/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

function RouteBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div role="status" className="py-10 text-sm text-muted-foreground">
          Exam Builder…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const route = (element: ReactNode) => <RouteBoundary>{element}</RouteBoundary>;

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={route(<DashboardPage />)} />
          <Route path="exams/new" element={route(<NewExamPage />)} />
          <Route path="exams/:id/edit" element={route(<ExamBuilderPage />)} />
          <Route path="templates" element={route(<TemplatesPage />)} />
          <Route path="settings" element={route(<SettingsPage />)} />
          {RendererReferencePage && BuilderLayoutReferencePage ? (
            <>
              <Route
                path="dev/renderer-reference"
                element={route(<RendererReferencePage />)}
              />
              <Route
                path="dev/builder-layout-reference"
                element={route(<BuilderLayoutReferencePage />)}
              />
            </>
          ) : null}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const RendererReferencePage = import.meta.env.DEV
  ? lazy(() =>
      import(
        /* @vite-ignore */ "../../features/exam-renderer/dev/RendererReferencePage"
      ).then((module) => ({ default: module.RendererReferencePage })),
    )
  : null;
const BuilderLayoutReferencePage = import.meta.env.DEV
  ? lazy(() =>
      import(
        /* @vite-ignore */ "../../features/exam-builder/dev/BuilderLayoutReferencePage"
      ).then((module) => ({ default: module.BuilderLayoutReferencePage })),
    )
  : null;
