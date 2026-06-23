import { mysqlTable, varchar, text, int, boolean, timestamp, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { admins } from "./admins.js";

export const skillTestQuestions = mysqlTable("skill_test_questions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  questionText: text("question_text").notNull(),
  questionType: mysqlEnum("question_type", ["multiple_choice", "essay", "coding"]).notNull(),
  options: json("options"),
  correctAnswer: text("correct_answer"),
  pointValue: int("point_value").notNull().default(10),
  tags: json("tags"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by", { length: 36 }).references(() => admins.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
