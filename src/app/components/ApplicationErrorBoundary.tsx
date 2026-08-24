import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface BoundaryProps {
  children: ReactNode;
  title: string;
  retryLabel: string;
  homeLabel: string;
}

interface BoundaryState {
  failed: boolean;
}

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-6">
        <section
          role="alert"
          className="w-full max-w-lg rounded-xl border bg-background p-6 text-center shadow-sm"
        >
          <h1 className="text-xl font-semibold">{this.props.title}</h1>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={() => window.location.reload()}>
              {this.props.retryLabel}
            </Button>
            <Button asChild variant="outline">
              <a href="/">{this.props.homeLabel}</a>
            </Button>
          </div>
        </section>
      </main>
    );
  }
}

export function ApplicationErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      title={t("errors.unexpected")}
      retryLabel={t("errors.retry")}
      homeLabel={t("errors.backToExams")}
    >
      {children}
    </ErrorBoundary>
  );
}
