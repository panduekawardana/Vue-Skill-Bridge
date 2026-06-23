import crypto from "crypto";
import { eq, sql, count, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/schema/users.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { admins } from "../db/schema/admins.js";
import { internships } from "../db/schema/internships.js";
import { matchmaking } from "../db/schema/matchmaking.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

// ─── DASHBOARD STATS ───────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [[totalStudents], [totalUmkm], [totalAdmins], [activeInternships], [pendingMatches], [completedInternships]] =
    await Promise.all([
      db.select({ count: count() }).from(students),
      db.select({ count: count() }).from(umkm),
      db.select({ count: count() }).from(admins),
      db.select({ count: count() }).from(internships).where(eq(internships.status, "active")),
      db.select({ count: count() }).from(matchmaking).where(eq(matchmaking.status, "pending")),
      db.select({ count: count() }).from(internships).where(eq(internships.status, "completed")),
    ]);

  const [unverifiedUmkm] = await db
    .select({ count: count() })
    .from(umkm)
    .where(eq(umkm.isVerified, false));

  res.json({
    totalStudents: totalStudents.count,
    totalUmkm: totalUmkm.count,
    totalAdmins: totalAdmins.count,
    activeInternships: activeInternships.count,
    pendingMatches: pendingMatches.count,
    completedInternships: completedInternships.count,
    unverifiedUmkm: unverifiedUmkm.count,
  });
});

// ─── USERS CRUD ────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const conditions = [];

  if (role) conditions.push(eq(users.role, role));
  if (q) {
    conditions.push(
      sql`(${users.fullName} LIKE ${`%${q}%`} OR ${users.email} LIKE ${`%${q}%`} OR ${users.phone} LIKE ${`%${q}%`})`,
    );
  }

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      fullName: users.fullName,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(users.createdAt);

  res.json(result);
});

export const getUser = asyncHandler(async (req, res) => {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("User not found", 404);

  const { passwordHash, ...safe } = result;
  res.json(safe);
});

export const updateUser = asyncHandler(async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
  if (!user) throw new AppError("User not found", 404);

  const allowed = ["fullName", "email", "phone", "isVerified"];
  const updateData = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  if (req.body.role) {
    const [admin] = await db.select().from(admins).where(eq(admins.userId, req.user.userId)).limit(1);
    if (admin?.roleLevel !== "superadmin") throw new AppError("Only superadmin can change role", 403);
    updateData.role = req.body.role;
  }

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  await db.update(users).set(updateData).where(eq(users.id, req.params.id));

  const [updated] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
  if (!user) throw new AppError("User not found", 404);

  if (user.role === "student") await db.delete(students).where(eq(students.userId, user.id));
  if (user.role === "umkm") await db.delete(umkm).where(eq(umkm.userId, user.id));
  if (user.role === "admin") await db.delete(admins).where(eq(admins.userId, user.id));

  await db.delete(users).where(eq(users.id, user.id));
  res.json({ message: "User deleted successfully" });
});

// ─── ADMIN SPECIFIC ────────────────────────────────────────────

export const getAllAdmins = asyncHandler(async (_req, res) => {
  const result = await db
    .select({
      id: admins.id,
      userId: admins.userId,
      roleLevel: admins.roleLevel,
      permissions: admins.permissions,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      isVerified: users.isVerified,
    })
    .from(admins)
    .leftJoin(users, eq(admins.userId, users.id))
    .orderBy(admins.roleLevel);

  res.json(result);
});

export const createAdmin = asyncHandler(async (req, res) => {
  const [current] = await db.select().from(admins).where(eq(admins.userId, req.user.userId)).limit(1);
  if (current?.roleLevel !== "superadmin") throw new AppError("Only superadmin can create admins", 403);

  const { email, phone, password, fullName, roleLevel, permissions } = req.body;

  if (!email || !phone || !password || !fullName || !roleLevel) {
    throw new AppError("email, phone, password, fullName, and roleLevel are required", 400);
  }

  const bcrypt = (await import("bcryptjs")).default;
  const id = generateId();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({ id, email, phone, passwordHash, fullName, role: "admin", isVerified: true });

  const defaultPermissions = {
    superadmin: [
      "user:read", "user:write", "user:delete", "user:ban", "user:unban",
      "student:read", "student:write",
      "umkm:read", "umkm:write", "umkm:verify",
      "internship:read", "internship:write", "internship:delete",
      "match:read", "match:write", "match:override",
      "question:read", "question:write", "question:delete",
      "notification:send",
      "certificate:issue", "certificate:revoke",
      "statistics:read", "statistics:export",
      "system:config", "system:log", "system:audit",
    ],
    moderator: [
      "user:read", "student:read", "umkm:read", "umkm:verify",
      "internship:read", "match:read",
      "question:read", "question:write", "question:delete",
      "statistics:read", "statistics:export", "system:log",
    ],
    support: [
      "user:read", "student:read", "umkm:read",
      "internship:read", "match:read",
      "notification:send",
    ],
  };

  await db.insert(admins).values({
    id: generateId(),
    userId: id,
    roleLevel,
    permissions: JSON.parse(JSON.stringify(permissions || defaultPermissions[roleLevel] || [])),
  });

  res.status(201).json({ message: "Admin created successfully", userId: id });
});
