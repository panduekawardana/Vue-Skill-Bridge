import { mysqlTable, varchar, text, json, timestamp } from "drizzle-orm/mysql-core";
import { students } from "./students.js";
import { internships } from "./internships.js";

export const certificates = mysqlTable("certificates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  studentId: varchar("student_id", { length: 36 })
    .notNull()
    .references(() => students.id),
  internshipId: varchar("internship_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => internships.id),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  fileUrl: text("file_url"),
  metadata: json("metadata"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});
