import { useEffect, useState } from "react";

import { useAssetRepository } from "@/app/providers/useAssetRepository";
import type { ImageAssetRecord } from "@/domain/assets";

export type ImageAssetLoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error" }
  | { status: "success"; asset: ImageAssetRecord; objectUrl: string };

export function useImageAsset(imageId: string): ImageAssetLoadState {
  const repository = useAssetRepository();
  const [resolved, setResolved] = useState<{
    imageId: string;
    state: ImageAssetLoadState;
  }>(() => ({ imageId, state: { status: "loading" } }));

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    void repository
      .findById(imageId)
      .then((asset) => {
        if (!active) return;
        if (asset === null) {
          setResolved({ imageId, state: { status: "missing" } });
          return;
        }
        objectUrl = URL.createObjectURL(asset.blob);
        setResolved({
          imageId,
          state: { status: "success", asset, objectUrl },
        });
      })
      .catch(() => {
        if (active) setResolved({ imageId, state: { status: "error" } });
      });

    return () => {
      active = false;
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId, repository]);

  return resolved.imageId === imageId ? resolved.state : { status: "loading" };
}
