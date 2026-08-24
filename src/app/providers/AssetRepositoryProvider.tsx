import type { PropsWithChildren } from "react";

import { AssetRepositoryContext } from "@/app/providers/asset-repository.context";
import type { AssetRepository } from "@/domain/repositories/asset-repository";

export function AssetRepositoryProvider({
  repository,
  children,
}: PropsWithChildren<{ repository: AssetRepository }>) {
  return (
    <AssetRepositoryContext.Provider value={repository}>
      {children}
    </AssetRepositoryContext.Provider>
  );
}
