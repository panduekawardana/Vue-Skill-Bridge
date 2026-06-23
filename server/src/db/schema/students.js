import { mysqlTable, varchar, text, int, timestamp, json } from "drizzle-orm/mysql-core";
import { users } from "./users.js";

export const students = mysqlTable("students", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => users.id),
  nisn: varchar("nisn", { length: 20 }).unique(),
  school: varchar("school", { length: 200 }).notNull(),
  major: varchar("major", { length: 100 }).notNull(),
  graduationYear: int("graduation_year"),
  bio: text("bio"),
  skills: json("skills"),
  portfolioUrl: text("portfolio_url"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
