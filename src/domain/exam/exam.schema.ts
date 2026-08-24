import { z } from "zod";

import type {
  DefinitionBlock,
  DefinitionItem,
  EssayBlock,
  EssayTopic,
  ExamBlock,
  FillBlankBlock,
  FillBlankSegment,
  FreeTextBlock,
  ImageBlock,
  InstructionBlock,
  MatchingBlock,
  MatchingItem,
  MultipleChoiceBlock,
  MultipleChoiceOption,
  PageBreakBlock,
  QuestionBlock,
  SeparatorBlock,
  TableBlock,
  TableCell,
  TableColumn,
  TableRow,
  TextDocumentBlock,
  TrueFalseBlock,
  TrueFalseStatement,
} from "@/domain/exam/blocks.types";
import {
  CURRENT_EXAM_SCHEMA_VERSION,
  type Exam,
  type ExamMetadata,
  type ExamSection,
  type ExamSettings,
  type StudentFieldsSettings,
} from "@/domain/exam/exam.types";

const identifierSchema = z.string().min(1);
const pointsSchema = z.number().finite().nonnegative();
const orderSchema = z.number().int().nonnegative();
const positiveIntegerSchema = z.number().int().positive();

const baseBlockShape = {
  id: identifierSchema,
  order: orderSchema,
  points: pointsSchema.optional(),
  startsNewQuestion: z.boolean(),
};

export const InstructionBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("instruction"),
  content: z.string(),
}) satisfies z.ZodType<InstructionBlock>;

export const TextDocumentBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("text-document"),
  instruction: z.string().optional(),
  title: z.string().optional(),
  content: z.string(),
  source: z.string().optional(),
  reference: z.string().optional(),
  bordered: z.boolean().optional(),
}) satisfies z.ZodType<TextDocumentBlock>;

export const ImageBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("image"),
  imageId: identifierSchema,
  title: z.string().optional(),
  caption: z.string().optional(),
  source: z.string().optional(),
  width: z.number().finite().positive().optional(),
  alignment: z.enum(["start", "center", "end"]).optional(),
  bordered: z.boolean().optional(),
}) satisfies z.ZodType<ImageBlock>;

const questionBlockShapeSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("question"),
  question: z.string(),
  answerMode: z.enum(["none", "lines", "box"]),
  answerLines: positiveIntegerSchema.optional(),
});

function validateQuestionAnswerSettings(
  question: Pick<QuestionBlock, "answerMode" | "answerLines">,
  context: z.RefinementCtx,
) {
  if (question.answerMode === "lines" && question.answerLines === undefined) {
    context.addIssue({
      code: "custom",
      path: ["answerLines"],
      message: "QUESTION_ANSWER_LINES_REQUIRED",
    });
  }

  if (question.answerMode === "none" && question.answerLines !== undefined) {
    context.addIssue({
      code: "custom",
      path: ["answerLines"],
      message: "QUESTION_ANSWER_LINES_NOT_ALLOWED",
    });
  }
}

export const QuestionBlockSchema = questionBlockShapeSchema.superRefine(
  validateQuestionAnswerSettings,
) satisfies z.ZodType<QuestionBlock>;

export const DefinitionItemSchema = z.strictObject({
  id: identifierSchema,
  term: z.string(),
  answerLines: positiveIntegerSchema,
  points: pointsSchema.optional(),
}) satisfies z.ZodType<DefinitionItem>;

export const DefinitionBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("definition"),
  instruction: z.string().optional(),
  items: z.array(DefinitionItemSchema).min(1),
}) satisfies z.ZodType<DefinitionBlock>;

export const TrueFalseStatementSchema = z.strictObject({
  id: identifierSchema,
  text: z.string(),
  points: pointsSchema.optional(),
}) satisfies z.ZodType<TrueFalseStatement>;

export const TrueFalseBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("true-false"),
  instruction: z.string().optional(),
  statements: z.array(TrueFalseStatementSchema),
}) satisfies z.ZodType<TrueFalseBlock>;

export const MultipleChoiceOptionSchema = z.strictObject({
  id: identifierSchema,
  text: z.string(),
}) satisfies z.ZodType<MultipleChoiceOption>;

export const MultipleChoiceBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("multiple-choice"),
  question: z.string(),
  options: z.array(MultipleChoiceOptionSchema).min(1),
  allowMultipleAnswers: z.boolean().optional(),
}) satisfies z.ZodType<MultipleChoiceBlock>;

const fillBlankTextSegmentSchema = z.strictObject({
  type: z.literal("text"),
  value: z.string(),
});

const fillBlankBlankSegmentSchema = z.strictObject({
  type: z.literal("blank"),
  id: identifierSchema,
  width: z.number().finite().positive().optional(),
});

export const FillBlankSegmentSchema = z.discriminatedUnion("type", [
  fillBlankTextSegmentSchema,
  fillBlankBlankSegmentSchema,
]) satisfies z.ZodType<FillBlankSegment>;

export const FillBlankBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("fill-blank"),
  instruction: z.string().optional(),
  segments: z.array(FillBlankSegmentSchema),
}) satisfies z.ZodType<FillBlankBlock>;

export const TableColumnSchema = z.strictObject({
  id: identifierSchema,
  label: z.string(),
}) satisfies z.ZodType<TableColumn>;

export const TableCellSchema = z.strictObject({
  columnId: identifierSchema,
  value: z.string().optional(),
}) satisfies z.ZodType<TableCell>;

export const TableRowSchema = z.strictObject({
  id: identifierSchema,
  cells: z.array(TableCellSchema),
}) satisfies z.ZodType<TableRow>;

export const TableBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("table"),
  columns: z.array(TableColumnSchema).min(1),
  rows: z.array(TableRowSchema),
  showHeader: z.boolean(),
}) satisfies z.ZodType<TableBlock>;

export const MatchingItemSchema = z.strictObject({
  id: identifierSchema,
  text: z.string(),
}) satisfies z.ZodType<MatchingItem>;

export const MatchingBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("matching"),
  instruction: z.string().optional(),
  leftItems: z.array(MatchingItemSchema),
  rightItems: z.array(MatchingItemSchema),
  shuffleRight: z.boolean().optional(),
}) satisfies z.ZodType<MatchingBlock>;

export const EssayTopicSchema = z.strictObject({
  id: identifierSchema,
  text: z.string(),
}) satisfies z.ZodType<EssayTopic>;

export const EssayBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("essay"),
  context: z.string().optional(),
  instruction: z.string(),
  topics: z.array(EssayTopicSchema),
}) satisfies z.ZodType<EssayBlock>;

export const FreeTextBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("free-text"),
  content: z.string(),
  variant: z.enum(["paragraph", "note", "subtitle"]).optional(),
}) satisfies z.ZodType<FreeTextBlock>;

export const SeparatorBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("separator"),
  startsNewQuestion: z.literal(false),
  style: z.enum(["line", "space"]).optional(),
}) satisfies z.ZodType<SeparatorBlock>;

export const PageBreakBlockSchema = z.strictObject({
  ...baseBlockShape,
  type: z.literal("page-break"),
  startsNewQuestion: z.literal(false),
}) satisfies z.ZodType<PageBreakBlock>;

const structuralExamBlockSchema = z.discriminatedUnion("type", [
  InstructionBlockSchema,
  TextDocumentBlockSchema,
  ImageBlockSchema,
  questionBlockShapeSchema,
  DefinitionBlockSchema,
  TrueFalseBlockSchema,
  MultipleChoiceBlockSchema,
  FillBlankBlockSchema,
  TableBlockSchema,
  MatchingBlockSchema,
  EssayBlockSchema,
  FreeTextBlockSchema,
  SeparatorBlockSchema,
  PageBreakBlockSchema,
]);

export const ExamBlockSchema = structuralExamBlockSchema.superRefine(
  (block, context) => {
    if (block.type === "question") {
      validateQuestionAnswerSettings(block, context);
    }
  },
) satisfies z.ZodType<ExamBlock>;

export const ExamMetadataSchema = z.strictObject({
  title: z.string(),
  academicYear: z.string(),
  institution: z.string().optional(),
  regionalAcademy: z.string().optional(),
  provincialDirectorate: z.string().optional(),
  level: z.string(),
  subject: z.string(),
  teacherName: z.string().optional(),
  durationMinutes: positiveIntegerSchema.optional(),
  totalPoints: pointsSchema.optional(),
  examNumber: z.string().optional(),
}) satisfies z.ZodType<ExamMetadata>;

export const StudentFieldsSettingsSchema = z.strictObject({
  showFullName: z.boolean(),
  showStudentNumber: z.boolean(),
  showClassName: z.boolean(),
  showGrade: z.boolean(),
}) satisfies z.ZodType<StudentFieldsSettings>;

export const ExamSettingsSchema = z.strictObject({
  documentLanguage: z.enum(["ar", "fr"]),
  templateId: identifierSchema,
  showTotalPoints: z.boolean(),
  questionNumbering: z.strictObject({
    enabled: z.boolean(),
    restartPerSection: z.boolean(),
  }),
}) satisfies z.ZodType<ExamSettings>;

export const ExamSectionSchema = z.strictObject({
  id: identifierSchema,
  title: z.string(),
  subject: z.string().optional(),
  points: pointsSchema.optional(),
  blocks: z.array(ExamBlockSchema),
}) satisfies z.ZodType<ExamSection>;

export const ExamSchema = z.strictObject({
  schemaVersion: z.literal(CURRENT_EXAM_SCHEMA_VERSION),
  id: identifierSchema,
  metadata: ExamMetadataSchema,
  studentFields: StudentFieldsSettingsSchema,
  sections: z.array(ExamSectionSchema),
  settings: ExamSettingsSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<Exam>;
