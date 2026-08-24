import { duplicateExam, type Exam, type ExamId } from "@/domain/exam";
import type { ExamRepository } from "@/domain/repositories/exam-repository";
import { createId } from "@/lib/create-id";

export interface ExamServiceRuntime {
  createId(): string;
  now(): string;
}

const browserRuntime: ExamServiceRuntime = {
  createId,
  now: () => new Date().toISOString(),
};

export class ExamService {
  constructor(
    private readonly repository: ExamRepository,
    private readonly runtime: ExamServiceRuntime = browserRuntime,
  ) {}

  findAll(): Promise<Exam[]> {
    return this.repository.findAll();
  }

  async duplicate(source: Exam): Promise<Exam> {
    const duplicate = duplicateExam(source, {
      id: this.runtime.createId(),
      now: this.runtime.now(),
      createInternalId: () => this.runtime.createId(),
    });

    await this.repository.save(duplicate);
    return duplicate;
  }

  delete(id: ExamId): Promise<void> {
    return this.repository.delete(id);
  }
}

export function sortExamsByUpdatedAt(exams: Exam[]): Exam[] {
  return [...exams].sort(
    (first, second) =>
      Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
  );
}
