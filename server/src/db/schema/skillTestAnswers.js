import { mysqlTable, varchar, text, int, boolean, timestamp } from "drizzle-orm/mysql-core";
import { skillTestAttempts } from "./skillTestAttempts.js";
import { skillTestQuestions } from "./skillTestQuestions.js";

export const skillTestAnswers = mysqlTable("skill_test_answers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  attemptId: varchar("attempt_id", { length: 36 })
    .notNull()
    .references(() => skillTestAttempts.id),
  questionId: varchar("question_id", { length: 36 })
    .notNull()
    .references(() => skillTestQuestions.id),
  answerText: text("answer_text"),
  isCorrect: boolean("is_correct"),
  scoreObtained: int("score_obtained"),
  answeredAt: timestamp("answered_at").notNull(),
});
