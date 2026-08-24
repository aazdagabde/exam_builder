import { Check, Plus } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { countEssayBlocks, type ExamBlockType } from "@/domain/exam";
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/domain/assets";
import {
  BLOCK_CATALOG,
  type BlockCatalogCategory,
} from "@/features/exam-builder/blocks/block-catalog";
import { saveImageFile } from "@/features/exam-builder/assets/image-assets";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

export function BlockPaletteDialog() {
  const { t } = useTranslation();
  const repository = useAssetRepository();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const hasActiveSection = useExamBuilderStore((state) =>
    state.exam?.sections.some(
      (section) => section.id === state.selectedSectionId,
    ),
  );
  const hasEssay = useExamBuilderStore((state) =>
    state.exam ? countEssayBlocks(state.exam) > 0 : false,
  );
  const addBlock = useExamBuilderStore((state) => state.addBlock);
  const addImageBlock = useExamBuilderStore((state) => state.addImageBlock);

  const handleAdd = (type: ExamBlockType) => {
    const result = addBlock(type);
    if (result.ok) {
      setErrorReason(null);
      setOpen(false);
      return;
    }
    setErrorReason(result.reason);
  };

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    setImageError(null);
    setErrorReason(null);
    const saved = await saveImageFile(file, repository);
    setUploadingImage(false);
    if (!saved.ok) {
      setImageError(saved.reason);
      return;
    }
    const result = addImageBlock(saved.asset.id);
    if (!result.ok) {
      setErrorReason(result.reason);
      return;
    }
    setOpen(false);
  };

  if (!hasActiveSection) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        {t("examBuilder.blocks.noSection")}
      </p>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setErrorReason(null);
          setImageError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          {t("examBuilder.blocks.add")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("examBuilder.blocks.palette.title")}</DialogTitle>
          <DialogDescription>
            {t("examBuilder.blocks.palette.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65dvh] space-y-5 overflow-y-auto pe-1">
          {(["content", "exercises", "structure"] as const).map((category) => (
            <section key={category} aria-labelledby={`palette-${category}`}>
              <h3
                id={`palette-${category}`}
                className="mb-2 text-sm font-semibold"
              >
                {t(`examBuilder.blocks.palette.categories.${category}`)}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {BLOCK_CATALOG.filter(
                  (entry) =>
                    entry.category === (category as BlockCatalogCategory),
                ).map(({ type, labelKey, descriptionKey, icon: Icon }) => {
                  const essayUnavailable = type === "essay" && hasEssay;
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      className="h-auto min-h-20 items-start justify-start whitespace-normal px-4 py-3 text-start"
                      disabled={essayUnavailable || uploadingImage}
                      aria-label={t(labelKey)}
                      aria-describedby={
                        essayUnavailable ? "essay-limit-explanation" : undefined
                      }
                      onClick={() =>
                        type === "image"
                          ? imageInputRef.current?.click()
                          : handleAdd(type)
                      }
                    >
                      <Icon className="size-5" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-medium">{t(labelKey)}</span>
                        <span className="mt-0.5 block text-xs font-normal leading-4 text-muted-foreground">
                          {t(descriptionKey)}
                        </span>
                      </span>
                      {essayUnavailable ? (
                        <Check className="ms-auto size-4" aria-hidden="true" />
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <input
          ref={imageInputRef}
          className="sr-only"
          type="file"
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
          aria-label={t("examBuilder.blocks.image.chooseFile")}
          onChange={(event) => void handleImageFile(event)}
        />

        {hasEssay ? (
          <p
            id="essay-limit-explanation"
            className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
          >
            {t("examBuilder.blocks.essayLimit")}
          </p>
        ) : null}
        {uploadingImage ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("examBuilder.blocks.image.saving")}
          </p>
        ) : null}
        {imageError ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`examBuilder.blocks.image.errors.${imageError}`)}
          </p>
        ) : null}
        {errorReason ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`examBuilder.blocks.errors.${errorReason}`)}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
