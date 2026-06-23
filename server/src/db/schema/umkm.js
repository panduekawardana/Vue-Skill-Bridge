import { mysqlTable, varchar, text, boolean, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users.js";
import { admins } from "./admins.js";

export const umkm = mysqlTable("umkm", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => users.id),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  businessType: varchar("business_type", { length: 100 }).notNull(),
  nib: varchar("nib", { length: 50 }),
  taxId: varchar("tax_id", { length: 50 }),
  description: text("description"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  phoneOffice: varchar("phone_office", { length: 20 }),
  website: text("website"),
  logoUrl: text("logo_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by", { length: 36 }).references(() => admins.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
