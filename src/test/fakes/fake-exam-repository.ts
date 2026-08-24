import type { Exam, ExamId } from "@/domain/exam";
import type { ExamRepository } from "@/domain/repositories/exam-repository";

interface FakeExamRepositoryOptions {
  findAll?(): Promise<Exam[]>;
  findById?(id: ExamId): Promise<Exam | null>;
  save?(exam: Exam): Promise<void>;
  delete?(id: ExamId): Promise<void>;
}

export class FakeExamRepository implements ExamRepository {
  findAllCalls = 0;
  readonly findByIdCalls: ExamId[] = [];
  readonly savedExams: Exam[] = [];
  readonly deletedIds: ExamId[] = [];

  constructor(
    private exams: Exam[] = [],
    private readonly options: FakeExamRepositoryOptions = {},
  ) {}

  async findAll(): Promise<Exam[]> {
    this.findAllCalls += 1;

    if (this.options.findAll) {
      return this.options.findAll();
    }

    return structuredClone(this.exams);
  }

  async findById(id: ExamId): Promise<Exam | null> {
    this.findByIdCalls.push(id);

    if (this.options.findById) {
      return this.options.findById(id);
    }

    const exam = this.exams.find((candidate) => candidate.id === id);
    return exam ? structuredClone(exam) : null;
  }

  async save(exam: Exam): Promise<void> {
    if (this.options.save) {
      await this.options.save(exam);
    }

    const clonedExam = structuredClone(exam);
    this.savedExams.push(clonedExam);
    this.exams = [
      clonedExam,
      ...this.exams.filter((candidate) => candidate.id !== exam.id),
    ];
  }

  async delete(id: ExamId): Promise<void> {
    this.deletedIds.push(id);

    if (this.options.delete) {
      await this.options.delete(id);
    }

    this.exams = this.exams.filter((exam) => exam.id !== id);
  }
}
