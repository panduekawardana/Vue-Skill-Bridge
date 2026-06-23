import { mysqlTable, varchar, timestamp, json, text, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { matchmaking } from "./matchmaking.js";
import { students } from "./students.js";
import { umkm } from "./umkm.js";

export const internships = mysqlTable(
  "internships",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    matchId: varchar("match_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => matchmaking.id),
    studentId: varchar("student_id", { length: 36 })
      .notNull()
      .references(() => students.id),
    umkmId: varchar("umkm_id", { length: 36 })
      .notNull()
      .references(() => umkm.id),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: mysqlEnum("status", ["scheduled", "active", "completed", "cancelled"])
      .notNull()
      .default("scheduled"),
    dailyLog: json("daily_log"),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [index("idx_internship_status").on(table.status, table.startDate)],
);
