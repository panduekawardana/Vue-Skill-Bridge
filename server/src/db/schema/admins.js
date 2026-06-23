import { mysqlTable, varchar, json, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { users } from "./users.js";

export const admins = mysqlTable("admins", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => users.id),
  roleLevel: mysqlEnum("role_level", ["superadmin", "moderator", "support"]).notNull(),
  permissions: json("permissions").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
