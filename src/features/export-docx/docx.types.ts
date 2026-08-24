import type { Document } from "docx";

import type { ImageAssetRecord } from "@/domain/assets";
import type { ExamValidationIssue } from "@/domain/exam";

export type DocxRasterType = "png" | "jpg";

export interface DocxImageData {
  type: DocxRasterType;
  data: Uint8Array;
  widthPx: number;
  heightPx: number;
}

export type DocxImageWarningCode =
  | "IMAGE_MISSING"
  | "IMAGE_LOAD_FAILED"
  | "IMAGE_CONVERSION_FAILED"
  | "LOGO_UNAVAILABLE";

export interface DocxImageWarning {
  code: DocxImageWarningCode;
  imageId?: string;
}

export interface DocxResolvedAssets {
  images: ReadonlyMap<string, DocxImageData>;
  institutionalLogo?: DocxImageData;
}

export interface DocxAssetResolver {
  findById(id: string): Promise<ImageAssetRecord | null>;
}

export interface DocxImageNormalizer {
  normalize(asset: ImageAssetRecord): Promise<DocxImageData>;
}

export interface CreatedExamDocx {
  document: Document;
  warnings: ExamValidationIssue[];
  imageWarnings: DocxImageWarning[];
  unavailableImageCount: number;
}
