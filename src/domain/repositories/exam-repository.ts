import type { Exam, ExamId } from "@/domain/exam";

export interface ExamRepository {
  findAll(): Promise<Exam[]>;
  findById(id: ExamId): Promise<Exam | null>;
  save(exam: Exam): Promise<void>;
  delete(id: ExamId): Promise<void>;
}
