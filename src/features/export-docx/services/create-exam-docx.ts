import {
  ExamSchema,
  validateExam,
  type Exam,
  type ExamValidationIssue,
} from "@/domain/exam";
import type {
  CreatedExamDocx,
  DocxAssetResolver,
  DocxImageData,
  DocxImageNormalizer,
  DocxImageWarning,
} from "@/features/export-docx/docx.types";
import { createExamDocument } from "@/features/export-docx/renderer/create-exam-document";
import { browserDocxImageNormalizer } from "@/features/export-docx/services/docx-images";

export type CreateExamDocxErrorCode = "INVALID_EXAM" | "GENERATION_FAILED";

export class CreateExamDocxError extends Error {
  constructor(public readonly code: CreateExamDocxErrorCode) {
    super(code);
    this.name = "CreateExamDocxError";
  }
}

export interface CreateExamDocxOptions {
  exam: Exam;
  assetResolver: DocxAssetResolver;
  imageNormalizer?: DocxImageNormalizer;
  institutionalLogo?: DocxImageData;
}

function validateExportableExam(exam: Exam): {
  exam: Exam;
  warnings: ExamValidationIssue[];
} {
  const structural = ExamSchema.safeParse(exam);
  if (!structural.success) throw new CreateExamDocxError("INVALID_EXAM");
  const issues = validateExam(structural.data);
  if (issues.some((issue) => issue.severity === "error")) {
    throw new CreateExamDocxError("INVALID_EXAM");
  }
  return {
    exam: structural.data,
    warnings: issues.filter((issue) => issue.severity === "warning"),
  };
}

export async function createExamDocx({
  exam,
  assetResolver,
  imageNormalizer = browserDocxImageNormalizer,
  institutionalLogo,
}: CreateExamDocxOptions): Promise<CreatedExamDocx> {
  const validated = validateExportableExam(exam);
  const imageIds = [
    ...new Set(
      validated.exam.sections.flatMap((section) =>
        section.blocks.flatMap((block) =>
          block.type === "image" ? [block.imageId] : [],
        ),
      ),
    ),
  ];
  const images = new Map<string, DocxImageData>();
  const imageWarnings: DocxImageWarning[] = [];

  await Promise.all(
    imageIds.map(async (imageId) => {
      let asset;
      try {
        asset = await assetResolver.findById(imageId);
      } catch {
        imageWarnings.push({ code: "IMAGE_LOAD_FAILED", imageId });
        return;
      }
      if (asset === null) {
        imageWarnings.push({ code: "IMAGE_MISSING", imageId });
        return;
      }
      try {
        images.set(imageId, await imageNormalizer.normalize(asset));
      } catch {
        imageWarnings.push({
          code:
            asset.mimeType === "image/webp"
              ? "IMAGE_CONVERSION_FAILED"
              : "IMAGE_LOAD_FAILED",
          imageId,
        });
      }
    }),
  );

  try {
    return {
      document: createExamDocument(validated.exam, {
        images,
        institutionalLogo,
      }),
      warnings: validated.warnings,
      imageWarnings,
      unavailableImageCount: imageWarnings.filter(
        (warning) => warning.imageId !== undefined,
      ).length,
    };
  } catch (error) {
    if (error instanceof CreateExamDocxError) throw error;
    throw new CreateExamDocxError("GENERATION_FAILED");
  }
}
