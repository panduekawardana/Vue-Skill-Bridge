import { mysqlTable, varchar, decimal, json, timestamp, mysqlEnum, unique } from "drizzle-orm/mysql-core";
import { students } from "./students.js";
import { internshipNeeds } from "./internshipNeeds.js";

export const matchmaking = mysqlTable(
  "matchmaking",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => students.id),
    needId: varchar("need_id", { length: 36 })
      .notNull()
      .references(() => internshipNeeds.id),
    matchScore: decimal("match_score", { precision: 5, scale: 2 }),
    matchDetails: json("match_details"),
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"])
      .notNull()
      .default("pending"),
    studentResponse: mysqlEnum("student_response", ["pending", "accepted", "rejected"])
      .notNull()
      .default("pending"),
    umkmResponse: mysqlEnum("umkm_response", ["pending", "accepted", "rejected"])
      .notNull()
      .default("pending"),
    matchedAt: timestamp("matched_at"),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("uq_match_student_need").on(table.studentId, table.needId)],
);
