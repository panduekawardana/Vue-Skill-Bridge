import { mysqlTable, varchar, int, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { students } from "./students.js";

export const skillTestAttempts = mysqlTable("skill_test_attempts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: varchar("student_id", { length: 36 })
    .notNull()
    .references(() => students.id),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  status: mysqlEnum("status", ["in_progress", "completed", "expired"]).notNull().default("in_progress"),
  totalScore: int("total_score"),
  adaptiveLevel: mysqlEnum("adaptive_level", ["beginner", "intermediate", "advanced"]),
});
