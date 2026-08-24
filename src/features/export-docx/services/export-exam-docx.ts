import { Packer } from "docx";

import type { Exam } from "@/domain/exam";
import { getSafeExamBaseName } from "@/features/exams/services/exam-export-file-name";
import type {
  CreatedExamDocx,
  DocxAssetResolver,
  DocxImageData,
  DocxImageNormalizer,
} from "@/features/export-docx/docx.types";
import {
  createExamDocx,
  CreateExamDocxError,
  type CreateExamDocxErrorCode,
} from "@/features/export-docx/services/create-exam-docx";
import { rasterizeBlobToPng } from "@/features/export-docx/services/docx-images";
import ministryLogoUrl from "../../../../ressource/logo.svg?url";

export type ExportExamDocxErrorCode =
  | CreateExamDocxErrorCode
  | "LOGO_LOAD_FAILED"
  | "PACK_FAILED"
  | "DOWNLOAD_FAILED";

export class ExportExamDocxError extends Error {
  constructor(public readonly code: ExportExamDocxErrorCode) {
    super(code);
    this.name = "ExportExamDocxError";
  }
}

interface DownloadRuntime {
  document: Document;
  url: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
}

export function getExamDocxFileName(exam: Exam): string {
  return `${getSafeExamBaseName(exam)}.docx`;
}

export function downloadDocxBlob(
  blob: Blob,
  fileName: string,
  runtime: DownloadRuntime = { document, url: URL },
): void {
  const objectUrl = runtime.url.createObjectURL(blob);
  const anchor = runtime.document.createElement("a");
  try {
    anchor.href = objectUrl;
    anchor.download = fileName || "exam.docx";
    anchor.hidden = true;
    runtime.document.body.append(anchor);
    anchor.click();
  } catch {
    throw new ExportExamDocxError("DOWNLOAD_FAILED");
  } finally {
    anchor.remove();
    runtime.url.revokeObjectURL(objectUrl);
  }
}

async function loadInstitutionalLogo(): Promise<DocxImageData> {
  const response = await fetch(ministryLogoUrl);
  if (!response.ok) throw new ExportExamDocxError("LOGO_LOAD_FAILED");
  return rasterizeBlobToPng(await response.blob());
}

export interface ExportExamDocxOptions {
  exam: Exam;
  assetResolver: DocxAssetResolver;
  imageNormalizer?: DocxImageNormalizer;
  loadLogo?: () => Promise<DocxImageData>;
  pack?: (created: CreatedExamDocx) => Promise<Blob>;
  download?: (blob: Blob, fileName: string) => void;
}

export async function exportExamDocx({
  exam,
  assetResolver,
  imageNormalizer,
  loadLogo = loadInstitutionalLogo,
  pack = (created) => Packer.toBlob(created.document),
  download = downloadDocxBlob,
}: ExportExamDocxOptions): Promise<CreatedExamDocx> {
  let institutionalLogo: DocxImageData | undefined;
  let logoUnavailable = false;
  try {
    institutionalLogo = await loadLogo();
  } catch {
    logoUnavailable = true;
  }

  let created: CreatedExamDocx;
  try {
    created = await createExamDocx({
      exam,
      assetResolver,
      imageNormalizer,
      institutionalLogo,
    });
  } catch (error) {
    if (error instanceof CreateExamDocxError) {
      throw new ExportExamDocxError(error.code);
    }
    throw new ExportExamDocxError("GENERATION_FAILED");
  }
  if (logoUnavailable) {
    created.imageWarnings.push({ code: "LOGO_UNAVAILABLE" });
  }

  let blob: Blob;
  try {
    blob = await pack(created);
  } catch {
    throw new ExportExamDocxError("PACK_FAILED");
  }
  download(blob, getExamDocxFileName(exam));
  return created;
}
