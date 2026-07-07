import { mysqlTable, varchar, text, mysqlEnum, timestamp, boolean } from "drizzle-orm/mysql-core";

export const supportTickets = mysqlTable("support_tickets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).notNull().default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).notNull().default("medium"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  resolvedAt: timestamp("resolved_at"),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
