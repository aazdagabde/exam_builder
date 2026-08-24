import { ImageIcon, LoaderCircle } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ImageAlignment, ImageBlock } from "@/domain/exam";
import { ACCEPTED_IMAGE_MIME_TYPES } from "@/domain/assets";
import { saveImageFile } from "@/features/exam-builder/assets/image-assets";
import { BlockEditorShell } from "@/features/exam-builder/components/block-editors/BlockEditorShell";
import { BlockPointsField } from "@/features/exam-builder/components/block-editors/BlockPointsField";
import { BooleanField } from "@/features/exam-builder/components/block-editors/BooleanField";
import { ValidatedNumberField } from "@/features/exam-builder/components/block-editors/ValidatedNumberField";
import { useImageAsset } from "@/features/exam-builder/hooks/useImageAsset";
import { useExamBuilderStore } from "@/features/exam-builder/store/useExamBuilderStore";

type OptionalImageTextField = "title" | "caption" | "source";

export function ImageBlockEditor({ block }: { block: ImageBlock }) {
  const { t } = useTranslation();
  const repository = useAssetRepository();
  const assetState = useImageAsset(block.imageId);
  const updateBlock = useExamBuilderStore((state) => state.updateBlock);
  const endHistoryGroup = useExamBuilderStore((state) => state.endHistoryGroup);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  const updateImage = (
    updater: (image: ImageBlock) => ImageBlock,
    historyGroup?: string,
  ) =>
    updateBlock(
      block.id,
      (candidate) =>
        candidate.type === "image" ? updater(candidate) : candidate,
      historyGroup ? { historyGroup } : undefined,
    );

  const updateOptionalText = (field: OptionalImageTextField, value: string) =>
    updateImage((image) => {
      const updated = { ...image };
      if (value === "") delete updated[field];
      else updated[field] = value;
      return updated;
    }, `block:${block.id}:${field}`);

  const replaceImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReplacing(true);
    setUploadError(null);
    const result = await saveImageFile(file, repository);
    setReplacing(false);
    if (!result.ok) {
      setUploadError(result.reason);
      return;
    }
    updateImage((image) => ({ ...image, imageId: result.asset.id }));
  };

  const textField = (field: OptionalImageTextField, multiline = false) => {
    const id = `image-${field}-${block.id}`;
    const historyKey = `block:${block.id}:${field}`;
    const props = {
      id,
      dir: "auto" as const,
      value: block[field] ?? "",
      placeholder: t(`examBuilder.blocks.image.placeholders.${field}`),
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateOptionalText(field, event.target.value),
      onBlur: () => endHistoryGroup(historyKey),
    };
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{t(`examBuilder.blocks.image.${field}`)}</Label>
        {multiline ? <Textarea {...props} /> : <Input {...props} />}
      </div>
    );
  };

  return (
    <BlockEditorShell type={block.type}>
      <div className="overflow-hidden rounded-lg border bg-muted/20">
        {assetState.status === "loading" ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            {t("examBuilder.blocks.image.loading")}
          </div>
        ) : null}
        {assetState.status === "success" ? (
          <div className="space-y-2 p-3">
            <img
              src={assetState.objectUrl}
              alt={t("examBuilder.blocks.image.previewAlt")}
              className="mx-auto max-h-80 max-w-full rounded object-contain"
            />
            <p className="text-center text-xs text-muted-foreground">
              {assetState.asset.fileName ?? assetState.asset.mimeType}
            </p>
          </div>
        ) : null}
        {assetState.status === "missing" || assetState.status === "error" ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-5 text-center text-sm text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden="true" />
            {t(
              assetState.status === "missing"
                ? "examBuilder.blocks.image.missing"
                : "examBuilder.blocks.image.loadError",
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`image-file-${block.id}`}>
          {t("examBuilder.blocks.image.replace")}
        </Label>
        <Input
          id={`image-file-${block.id}`}
          type="file"
          accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
          disabled={replacing}
          onChange={(event) => void replaceImage(event)}
        />
        {replacing ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("examBuilder.blocks.image.saving")}
          </p>
        ) : null}
        {uploadError ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`examBuilder.blocks.image.errors.${uploadError}`)}
          </p>
        ) : null}
      </div>

      {textField("title")}
      {textField("caption", true)}
      {textField("source")}

      <div className="grid gap-4 sm:grid-cols-2">
        <ValidatedNumberField
          id={`image-width-${block.id}`}
          label={t("examBuilder.blocks.image.width")}
          value={block.width}
          error={t("examBuilder.blocks.image.widthError")}
          min={1}
          step={1}
          optional
          isValid={(width) => width > 0}
          onValueChange={(width) =>
            updateImage((image) => {
              const updated = { ...image };
              if (width === undefined) delete updated.width;
              else updated.width = width;
              return updated;
            }, `block:${block.id}:width`)
          }
          onEditEnd={() => endHistoryGroup(`block:${block.id}:width`)}
        />
        <div className="space-y-2">
          <Label htmlFor={`image-alignment-${block.id}`}>
            {t("examBuilder.blocks.image.alignment")}
          </Label>
          <NativeSelect
            id={`image-alignment-${block.id}`}
            value={block.alignment ?? "center"}
            onChange={(event) =>
              updateImage((image) => ({
                ...image,
                alignment: event.target.value as ImageAlignment,
              }))
            }
          >
            {(["start", "center", "end"] as const).map((alignment) => (
              <option key={alignment} value={alignment}>
                {t(`examBuilder.blocks.image.alignments.${alignment}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <BooleanField
          id={`image-bordered-${block.id}`}
          label={t("examBuilder.blocks.image.bordered")}
          checked={block.bordered ?? false}
          onCheckedChange={(bordered) =>
            updateImage((image) => ({ ...image, bordered }))
          }
        />
        <BlockPointsField blockId={block.id} value={block.points} />
      </div>
    </BlockEditorShell>
  );
}
