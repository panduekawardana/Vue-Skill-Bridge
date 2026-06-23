import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { certificates } from "../db/schema/certificates.js";
import { internships } from "../db/schema/internships.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { users } from "../db/schema/users.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const getCertificates = asyncHandler(async (req, res) => {
  const conditions = [];

  if (req.user.role === "student") {
    const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
    if (studentProfile) conditions.push(eq(certificates.studentId, studentProfile.id));
  }

  const result = await db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
      metadata: certificates.metadata,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(certificates.issuedAt));

  res.json(result);
});

export const getCertificate = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: certificates.id,
      studentId: certificates.studentId,
      internshipId: certificates.internshipId,
      certificateNumber: certificates.certificateNumber,
      fileUrl: certificates.fileUrl,
      metadata: certificates.metadata,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      businessName: umkm.businessName,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(internships, eq(certificates.internshipId, internships.id))
    .leftJoin(umkm, eq(internships.umkmId, umkm.id))
    .where(eq(certificates.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Certificate not found", 404);
  res.json(result);
});
