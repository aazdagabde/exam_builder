import { useContext } from "react";

import { AssetRepositoryContext } from "@/app/providers/asset-repository.context";

export function useAssetRepository() {
  const repository = useContext(AssetRepositoryContext);
  if (repository === null) {
    throw new Error(
      "useAssetRepository must be used within AssetRepositoryProvider.",
    );
  }
  return repository;
}
