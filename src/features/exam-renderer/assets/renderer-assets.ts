import { useEffect, useMemo, useState } from "react";

import type { AssetRepository } from "@/domain/repositories/asset-repository";
import type { Exam } from "@/domain/exam";

export type ResolvedImageAsset =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error" }
  | { status: "ready"; objectUrl: string };

export type ResolvedImageAssets = ReadonlyMap<string, ResolvedImageAsset>;

export interface ImageAssetResolver {
  findById: AssetRepository["findById"];
}

export function getExamImageIds(exam: Exam): string[] {
  return [
    ...new Set(
      exam.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.type === "image" ? [block.imageId] : [],
        ),
      ),
    ),
  ];
}

export function useResolvedImageAssets(
  exam: Exam,
  resolver: ImageAssetResolver,
): ResolvedImageAssets {
  const imageKey = useMemo(() => getExamImageIds(exam).join("\u0000"), [exam]);
  const imageIds = useMemo(
    () => (imageKey ? imageKey.split("\u0000") : []),
    [imageKey],
  );
  const loadingAssets = useMemo<ResolvedImageAssets>(
    () => new Map(imageIds.map((id) => [id, { status: "loading" }])),
    [imageIds],
  );
  const [resolved, setResolved] = useState<{
    key: string;
    assets: ResolvedImageAssets;
  }>(() => ({ key: "", assets: new Map() }));

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    for (const imageId of imageIds) {
      void resolver
        .findById(imageId)
        .then((asset) => {
          if (!active) return;
          if (asset === null) {
            setResolved((current) => ({
              key: imageKey,
              assets: new Map(
                current.key === imageKey ? current.assets : loadingAssets,
              ).set(imageId, { status: "missing" }),
            }));
            return;
          }
          const objectUrl = URL.createObjectURL(asset.blob);
          objectUrls.push(objectUrl);
          setResolved((current) => ({
            key: imageKey,
            assets: new Map(
              current.key === imageKey ? current.assets : loadingAssets,
            ).set(imageId, { status: "ready", objectUrl }),
          }));
        })
        .catch(() => {
          if (active) {
            setResolved((current) => ({
              key: imageKey,
              assets: new Map(
                current.key === imageKey ? current.assets : loadingAssets,
              ).set(imageId, { status: "error" }),
            }));
          }
        });
    }

    return () => {
      active = false;
      for (const objectUrl of objectUrls) URL.revokeObjectURL(objectUrl);
    };
  }, [imageIds, imageKey, loadingAssets, resolver]);

  return resolved.key === imageKey ? resolved.assets : loadingAssets;
}
