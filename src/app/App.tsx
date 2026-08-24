import { AppProviders } from "@/app/providers/AppProviders";
import { AppRouter } from "@/app/router/AppRouter";
import { ApplicationErrorBoundary } from "@/app/components/ApplicationErrorBoundary";

export function App() {
  return (
    <AppProviders>
      <ApplicationErrorBoundary>
        <AppRouter />
      </ApplicationErrorBoundary>
    </AppProviders>
  );
}
