export * from "@/infrastructure/indexed-db/database";
export * from "@/infrastructure/indexed-db/database.types";

import { ExamBuilderDatabase } from "@/infrastructure/indexed-db/database";

export const examBuilderDatabase = new ExamBuilderDatabase();
