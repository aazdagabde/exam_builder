import { createContext } from "react";

import type { AssetRepository } from "@/domain/repositories/asset-repository";

export const AssetRepositoryContext = createContext<AssetRepository | null>(
  null,
);
