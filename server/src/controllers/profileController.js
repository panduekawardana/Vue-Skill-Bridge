import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/schema/users.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { admins } from "../db/schema/admins.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

// ─── STUDENTS ───────────────────────────────────────────────

export const getStudents = asyncHandler(async (req, res) => {
  const result = await db
    .select({
      id: students.id,
      userId: students.userId,
      nisn: students.nisn,
      school: students.school,
      major: students.major,
      graduationYear: students.graduationYear,
      bio: students.bio,
      skills: students.skills,
      city: students.city,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id));

  res.json(result);
});

export const getStudent = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: students.id,
      userId: students.userId,
      nisn: students.nisn,
      school: students.school,
      major: students.major,
      graduationYear: students.graduationYear,
      bio: students.bio,
      skills: students.skills,
      portfolioUrl: students.portfolioUrl,
      address: students.address,
      city: students.city,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      isVerified: users.isVerified,
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Student not found", 404);
  res.json(result);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const studentId = req.params.id;

  const [profile] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!profile) throw new AppError("Student not found", 404);

  if (profile.userId !== userId && req.user.role !== "admin") {
    throw new AppError("Forbidden. You can only update your own profile.", 403);
  }

  const allowed = ["school", "major", "graduationYear", "bio", "skills", "portfolioUrl", "address", "city", "nisn"];
  const updateData = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updateData[key] = key === "skills" ? JSON.parse(JSON.stringify(req.body[key])) : req.body[key];
    }
  }

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  await db.update(students).set(updateData).where(eq(students.id, studentId));

  const [updated] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  res.json(updated);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const [profile] = await db.select().from(students).where(eq(students.id, req.params.id)).limit(1);
  if (!profile) throw new AppError("Student not found", 404);

  await db.delete(students).where(eq(students.id, req.params.id));
  await db.delete(users).where(eq(users.id, profile.userId));

  res.json({ message: "Student deleted successfully" });
});

// ─── UMKM ──────────────────────────────────────────────────

export const getUmkm = asyncHandler(async (_req, res) => {
  const result = await db
    .select({
      id: umkm.id,
      userId: umkm.userId,
      businessName: umkm.businessName,
      businessType: umkm.businessType,
      city: umkm.city,
      isVerified: umkm.isVerified,
      description: umkm.description,
      logoUrl: umkm.logoUrl,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
    })
    .from(umkm)
    .leftJoin(users, eq(umkm.userId, users.id));

  res.json(result);
});

export const getUmkmDetail = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: umkm.id,
      userId: umkm.userId,
      businessName: umkm.businessName,
      businessType: umkm.businessType,
      nib: umkm.nib,
      taxId: umkm.taxId,
      description: umkm.description,
      address: umkm.address,
      city: umkm.city,
      phoneOffice: umkm.phoneOffice,
      website: umkm.website,
      logoUrl: umkm.logoUrl,
      isVerified: umkm.isVerified,
      verifiedAt: umkm.verifiedAt,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
    })
    .from(umkm)
    .leftJoin(users, eq(umkm.userId, users.id))
    .where(eq(umkm.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("UMKM not found", 404);
  res.json(result);
});

export const updateUmkm = asyncHandler(async (req, res) => {
  const { userId, role } = req.user;
  const umkmId = req.params.id;

  const [profile] = await db.select().from(umkm).where(eq(umkm.id, umkmId)).limit(1);
  if (!profile) throw new AppError("UMKM not found", 404);

  if (profile.userId !== userId && role !== "admin") {
    throw new AppError("Forbidden.", 403);
  }

  const allowed = [
    "businessName", "businessType", "nib", "taxId", "description",
    "address", "city", "phoneOffice", "website", "logoUrl",
  ];
  const updateData = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  await db.update(umkm).set(updateData).where(eq(umkm.id, umkmId));

  const [updated] = await db.select().from(umkm).where(eq(umkm.id, umkmId)).limit(1);
  res.json(updated);
});

export const deleteUmkm = asyncHandler(async (req, res) => {
  const [profile] = await db.select().from(umkm).where(eq(umkm.id, req.params.id)).limit(1);
  if (!profile) throw new AppError("UMKM not found", 404);

  await db.delete(umkm).where(eq(umkm.id, req.params.id));
  await db.delete(users).where(eq(users.id, profile.userId));

  res.json({ message: "UMKM deleted successfully" });
});

export const verifyUmkm = asyncHandler(async (req, res) => {
  const umkmId = req.params.id;

  const [profile] = await db.select().from(umkm).where(eq(umkm.id, umkmId)).limit(1);
  if (!profile) throw new AppError("UMKM not found", 404);

  const isVerified = req.body.isVerified !== false;

  await db
    .update(umkm)
    .set({
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
      verifiedBy: isVerified ? req.user.userId : null,
    })
    .where(eq(umkm.id, umkmId));

  await db.update(users).set({ isVerified }).where(eq(users.id, profile.userId));

  res.json({ message: `UMKM ${isVerified ? "verified" : "unverified"} successfully` });
});

// ─── ADMINS ─────────────────────────────────────────────────

export const getAdmins = asyncHandler(async (_req, res) => {
  const result = await db
    .select({
      id: admins.id,
      userId: admins.userId,
      roleLevel: admins.roleLevel,
      permissions: admins.permissions,
      email: users.email,
      fullName: users.fullName,
    })
    .from(admins)
    .leftJoin(users, eq(admins.userId, users.id));

  res.json(result);
});

export const getAdmin = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: admins.id,
      userId: admins.userId,
      roleLevel: admins.roleLevel,
      permissions: admins.permissions,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
    })
    .from(admins)
    .leftJoin(users, eq(admins.userId, users.id))
    .where(eq(admins.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Admin not found", 404);
  res.json(result);
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const adminId = req.params.id;

  const [profile] = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
  if (!profile) throw new AppError("Admin not found", 404);

  if (req.body.roleLevel) {
    if (req.user.role !== "admin") throw new AppError("Only superadmin can change role level", 403);

    const [current] = await db.select().from(admins).where(eq(admins.userId, req.user.userId)).limit(1);
    if (current?.roleLevel !== "superadmin") throw new AppError("Only superadmin can change role level", 403);
  }

  const updateData = {};
  if (req.body.roleLevel) updateData.roleLevel = req.body.roleLevel;
  if (req.body.permissions) updateData.permissions = JSON.parse(JSON.stringify(req.body.permissions));

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  await db.update(admins).set(updateData).where(eq(admins.id, adminId));

  const [updated] = await db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
  res.json(updated);
});
