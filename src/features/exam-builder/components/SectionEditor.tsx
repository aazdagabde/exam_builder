import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BlockEditor } from "@/features/exam-builder/components/BlockEditor";
import { BlockList } from "@/features/exam-builder/components/BlockList";
import { BlockPaletteDialog } from "@/features/exam-builder/components/BlockPaletteDialog";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function SectionEditor() {
  const { t } = useTranslation();
  const selectedSectionId = useExamBuilderStore(
    (state) => state.selectedSectionId,
  );
  const section = useExamBuilderStore((state) =>
    state.exam?.sections.find(
      (candidate) => candidate.id === state.selectedSectionId,
    ),
  );
  const setTitle = useExamBuilderStore((state) => state.setSectionTitle);
  const setSubject = useExamBuilderStore((state) => state.setSectionSubject);
  const setPoints = useExamBuilderStore((state) => state.setSectionPoints);

  if (!section || selectedSectionId === null) {
    return <BuilderEmptyStateFallback />;
  }

  return (
    <Card className="builder-section-editor min-w-0 gap-0 py-0">
      <CardHeader className="gap-1 px-5 py-4">
        <CardTitle role="heading" aria-level={2} dir="auto">
          {section.title.trim() || t("examBuilder.sections.untitled")}
        </CardTitle>
        <CardDescription>
          {t("examBuilder.section.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5 px-5 pb-5">
        <div className="builder-section-fields grid gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="builder-section-title">
              {t("examBuilder.section.fields.title")}
            </Label>
            <Input
              id="builder-section-title"
              dir="auto"
              value={section.title}
              onChange={(event) =>
                setTitle(selectedSectionId, event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="builder-section-subject">
              {t("examBuilder.section.fields.subject")}
            </Label>
            <Input
              id="builder-section-subject"
              dir="auto"
              value={section.subject ?? ""}
              onChange={(event) =>
                setSubject(selectedSectionId, event.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="builder-section-points">
              {t("examBuilder.section.fields.points")}
            </Label>
            <Input
              id="builder-section-points"
              type="number"
              min="0"
              step="0.5"
              value={section.points ?? ""}
              onChange={(event) =>
                setPoints(
                  selectedSectionId,
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
                )
              }
            />
          </div>
        </div>

        <Separator />

        <section
          className="min-w-0 space-y-4"
          aria-labelledby="section-blocks-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 id="section-blocks-title" className="font-semibold">
                {t("examBuilder.blocks.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("examBuilder.blocks.description")}
              </p>
            </div>
            <BlockPaletteDialog />
          </div>

          <div className="min-w-0 space-y-5">
            <BlockList />
            <Separator />
            <BlockEditor />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function BuilderEmptyStateFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
      {t("examBuilder.empty.selectSection")}
    </div>
  );
}
