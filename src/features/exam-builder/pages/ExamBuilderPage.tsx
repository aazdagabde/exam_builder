import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { BuilderEmptyState } from "@/features/exam-builder/components/BuilderEmptyState";
import { BuilderExamPreview } from "@/features/exam-builder/components/BuilderExamPreview";
import { BuilderHeader } from "@/features/exam-builder/components/BuilderHeader";
import { BuilderValidationSummary } from "@/features/exam-builder/components/BuilderValidationSummary";
import {
  BuilderErrorState,
  BuilderLoadingState,
  BuilderNotFoundState,
} from "@/features/exam-builder/components/BuilderLoadState";
import { BuilderStructurePanel } from "@/features/exam-builder/components/BuilderStructurePanel";
import {
  BuilderViewSwitcher,
  type BuilderPane,
} from "@/features/exam-builder/components/BuilderViewSwitcher";
import { DeleteSectionDialog } from "@/features/exam-builder/components/DeleteSectionDialog";
import { SectionEditor } from "@/features/exam-builder/components/SectionEditor";
import { createBuilderLayoutReferenceExam } from "@/features/exam-builder/dev/builder-layout.fixture";
import { BuilderLayoutDiagnostics } from "@/features/exam-builder/dev/BuilderLayoutDiagnostics";
import { useExamAutosave } from "@/features/exam-builder/hooks/useExamAutosave";
import { useExamBuilderShortcuts } from "@/features/exam-builder/hooks/useExamBuilderShortcuts";
import { useLoadExam } from "@/features/exam-builder/hooks/useLoadExam";
import { createExamBuilderStore } from "@/features/exam-builder/store/exam-builder.store";
import { ExamBuilderStoreProvider } from "@/features/exam-builder/store/ExamBuilderStoreProvider";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";
import "@/features/exam-builder/styles/builder-layout.css";

export function ExamBuilderPage() {
  const { id = "" } = useParams();
  const initialExam = useMemo(
    () => (import.meta.env.DEV ? createBuilderLayoutReferenceExam(id) : null),
    [id],
  );
  return (
    <ExamBuilderWorkspace key={id} examId={id} initialExam={initialExam} />
  );
}

function ExamBuilderWorkspace({
  examId,
  initialExam,
}: {
  examId: string;
  initialExam: ReturnType<typeof createBuilderLayoutReferenceExam>;
}) {
  const [store] = useState(() => {
    const builderStore = createExamBuilderStore();
    if (initialExam !== null) builderStore.getState().initialize(initialExam);
    return builderStore;
  });

  return (
    <ExamBuilderStoreProvider store={store}>
      <ExamBuilderController examId={examId} initialExam={initialExam} />
    </ExamBuilderStoreProvider>
  );
}

function ExamBuilderController({
  examId,
  initialExam,
}: {
  examId: string;
  initialExam: ReturnType<typeof createBuilderLayoutReferenceExam>;
}) {
  const retryLoad = useLoadExam(examId, initialExam);
  const saveNow = useExamAutosave();
  useExamBuilderShortcuts();

  const status = useExamBuilderStore((state) => state.status);
  const loadError = useExamBuilderStore((state) => state.error);
  const hasSections = useExamBuilderStore(
    (state) => (state.exam?.sections.length ?? 0) > 0,
  );
  const deleteSection = useExamBuilderStore((state) => state.deleteSection);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [activePane, setActivePane] = useState<BuilderPane>(() => {
    if (initialExam === null) return "editor";
    const requestedPane = new URLSearchParams(window.location.search).get(
      "qaPane",
    );
    return requestedPane === "structure" || requestedPane === "preview"
      ? requestedPane
      : "editor";
  });

  if (status === "idle" || status === "loading") {
    return <BuilderLoadingState />;
  }
  if (status === "not-found") {
    return <BuilderNotFoundState />;
  }
  if (status === "error") {
    return <BuilderErrorState error={loadError} onRetry={retryLoad} />;
  }

  return (
    <div className="builder-page">
      <BuilderHeader onSaveNow={saveNow} />
      <BuilderValidationSummary />
      <div data-print-hidden>
        <BuilderViewSwitcher
          activePane={activePane}
          onPaneChange={setActivePane}
        />
      </div>
      <div className="builder-workspace" data-active-pane={activePane}>
        <div
          id="builder-pane-structure"
          className="builder-pane builder-pane--structure"
          role="tabpanel"
          aria-labelledby="builder-tab-structure"
          data-print-hidden
        >
          <BuilderStructurePanel onRequestDelete={setSectionToDelete} />
        </div>
        <main
          id="builder-pane-editor"
          className="builder-pane builder-pane--editor"
          role="tabpanel"
          aria-labelledby="builder-tab-editor"
          data-print-hidden
        >
          {hasSections ? <SectionEditor /> : <BuilderEmptyState />}
        </main>
        <div
          id="builder-pane-preview"
          className="builder-pane builder-pane--preview builder-preview-panel"
          role="tabpanel"
          aria-labelledby="builder-tab-preview"
        >
          <BuilderExamPreview />
        </div>
      </div>
      <DeleteSectionDialog
        open={sectionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSectionToDelete(null);
        }}
        onConfirm={() => {
          if (sectionToDelete !== null) {
            deleteSection(sectionToDelete);
            setSectionToDelete(null);
          }
        }}
      />
      {import.meta.env.DEV && initialExam !== null ? (
        <BuilderLayoutDiagnostics />
      ) : null}
    </div>
  );
}
