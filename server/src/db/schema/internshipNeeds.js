import { mysqlTable, varchar, text, int, timestamp, json, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { umkm } from "./umkm.js";

export const internshipNeeds = mysqlTable(
  "internship_needs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    umkmId: varchar("umkm_id", { length: 36 })
      .notNull()
      .references(() => umkm.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    requiredSkills: json("required_skills"),
    requiredMajor: varchar("required_major", { length: 100 }),
    slotCount: int("slot_count").notNull(),
    slotFilled: int("slot_filled").notNull().default(0),
    startDate: timestamp("start_date"),
    durationDays: int("duration_days").notNull().default(14),
    compensation: varchar("compensation", { length: 100 }),
    status: mysqlEnum("status", ["open", "closed", "filled"]).notNull().default("open"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_need_umkm_status").on(table.umkmId, table.status)],
);
