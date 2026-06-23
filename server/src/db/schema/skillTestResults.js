import { mysqlTable, varchar, int, json, timestamp } from "drizzle-orm/mysql-core";
import { students } from "./students.js";
import { skillTestAttempts } from "./skillTestAttempts.js";

export const skillTestResults = mysqlTable("skill_test_results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: varchar("student_id", { length: 36 })
    .notNull()
    .references(() => students.id),
  attemptId: varchar("attempt_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => skillTestAttempts.id),
  overallScore: int("overall_score"),
  skillBreakdown: json("skill_breakdown"),
  recommendedRoles: json("recommended_roles"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
