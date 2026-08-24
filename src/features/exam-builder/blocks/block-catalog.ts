import {
  AlignJustify,
  BookOpenText,
  CheckSquare2,
  FileImage,
  FileQuestion,
  FormInput,
  GalleryHorizontalEnd,
  ListChecks,
  ListTree,
  Minus,
  Pilcrow,
  Rows3,
  Table2,
  TextQuote,
  type LucideIcon,
} from "lucide-react";

import type { ExamBlockType } from "@/domain/exam";

export interface BlockCatalogEntry {
  type: ExamBlockType;
  labelKey: string;
  descriptionKey: string;
  category: BlockCatalogCategory;
  icon: LucideIcon;
}

export type BlockCatalogCategory = "content" | "exercises" | "structure";

export const BLOCK_CATALOG: readonly BlockCatalogEntry[] = [
  {
    type: "instruction",
    labelKey: "examBuilder.blocks.types.instruction",
    descriptionKey: "examBuilder.blocks.descriptions.instruction",
    category: "content",
    icon: TextQuote,
  },
  {
    type: "text-document",
    labelKey: "examBuilder.blocks.types.textDocument",
    descriptionKey: "examBuilder.blocks.descriptions.textDocument",
    category: "content",
    icon: BookOpenText,
  },
  {
    type: "image",
    labelKey: "examBuilder.blocks.types.image",
    descriptionKey: "examBuilder.blocks.descriptions.image",
    category: "content",
    icon: FileImage,
  },
  {
    type: "question",
    labelKey: "examBuilder.blocks.types.question",
    descriptionKey: "examBuilder.blocks.descriptions.question",
    category: "exercises",
    icon: FileQuestion,
  },
  {
    type: "definition",
    labelKey: "examBuilder.blocks.types.definition",
    descriptionKey: "examBuilder.blocks.descriptions.definition",
    category: "exercises",
    icon: ListTree,
  },
  {
    type: "true-false",
    labelKey: "examBuilder.blocks.types.trueFalse",
    descriptionKey: "examBuilder.blocks.descriptions.trueFalse",
    category: "exercises",
    icon: CheckSquare2,
  },
  {
    type: "multiple-choice",
    labelKey: "examBuilder.blocks.types.multipleChoice",
    descriptionKey: "examBuilder.blocks.descriptions.multipleChoice",
    category: "exercises",
    icon: ListChecks,
  },
  {
    type: "fill-blank",
    labelKey: "examBuilder.blocks.types.fillBlank",
    descriptionKey: "examBuilder.blocks.descriptions.fillBlank",
    category: "exercises",
    icon: FormInput,
  },
  {
    type: "table",
    labelKey: "examBuilder.blocks.types.table",
    descriptionKey: "examBuilder.blocks.descriptions.table",
    category: "exercises",
    icon: Table2,
  },
  {
    type: "matching",
    labelKey: "examBuilder.blocks.types.matching",
    descriptionKey: "examBuilder.blocks.descriptions.matching",
    category: "exercises",
    icon: GalleryHorizontalEnd,
  },
  {
    type: "essay",
    labelKey: "examBuilder.blocks.types.essay",
    descriptionKey: "examBuilder.blocks.descriptions.essay",
    category: "exercises",
    icon: AlignJustify,
  },
  {
    type: "free-text",
    labelKey: "examBuilder.blocks.types.freeText",
    descriptionKey: "examBuilder.blocks.descriptions.freeText",
    category: "content",
    icon: Pilcrow,
  },
  {
    type: "separator",
    labelKey: "examBuilder.blocks.types.separator",
    descriptionKey: "examBuilder.blocks.descriptions.separator",
    category: "structure",
    icon: Minus,
  },
  {
    type: "page-break",
    labelKey: "examBuilder.blocks.types.pageBreak",
    descriptionKey: "examBuilder.blocks.descriptions.pageBreak",
    category: "structure",
    icon: Rows3,
  },
];

export function getBlockCatalogEntry(type: ExamBlockType): BlockCatalogEntry {
  return BLOCK_CATALOG.find((entry) => entry.type === type)!;
}
