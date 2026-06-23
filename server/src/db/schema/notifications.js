import { mysqlTable, varchar, text, boolean, timestamp, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { users } from "./users.js";

export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    type: mysqlEnum("type", ["match", "schedule", "evaluation", "certificate", "system"]).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    channel: mysqlEnum("channel", ["in_app", "whatsapp", "email"]).notNull(),
    referenceId: varchar("reference_id", { length: 36 }),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_notif_user_unread").on(table.userId, table.isRead, table.createdAt)],
);
