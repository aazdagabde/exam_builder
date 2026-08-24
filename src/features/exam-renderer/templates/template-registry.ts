import {
  MoroccanCollegeClassic,
  MOROCCAN_COLLEGE_CLASSIC_ID,
} from "@/features/exam-renderer/templates/moroccan-college-classic/MoroccanCollegeClassic";

export interface ExamTemplateDefinition {
  id: string;
  Component: typeof MoroccanCollegeClassic;
}

const DEFAULT_TEMPLATE: ExamTemplateDefinition = {
  id: MOROCCAN_COLLEGE_CLASSIC_ID,
  Component: MoroccanCollegeClassic,
};

const TEMPLATE_REGISTRY = new Map<string, ExamTemplateDefinition>([
  [DEFAULT_TEMPLATE.id, DEFAULT_TEMPLATE],
]);

export function getExamTemplate(templateId: string): ExamTemplateDefinition {
  return TEMPLATE_REGISTRY.get(templateId) ?? DEFAULT_TEMPLATE;
}
