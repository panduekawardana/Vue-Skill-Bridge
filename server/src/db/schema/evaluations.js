import { mysqlTable, varchar, int, text, json, timestamp, mysqlEnum, unique } from "drizzle-orm/mysql-core";
import { internships } from "./internships.js";

export const evaluations = mysqlTable(
  "evaluations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    internshipId: varchar("internship_id", { length: 36 })
      .notNull()
      .references(() => internships.id),
    evaluatorRole: mysqlEnum("evaluator_role", ["student", "umkm"]).notNull(),
    rating: int("rating"),
    reviewText: text("review_text"),
    skillAssessment: json("skill_assessment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("uq_evaluation_internship_role").on(table.internshipId, table.evaluatorRole)],
);
