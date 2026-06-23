import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";
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

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export const register = asyncHandler(async (req, res) => {
  const { email, phone, password, fullName, role, ...profileData } = req.body;

  if (!email || !phone || !password || !fullName || !role) {
    throw new AppError("email, phone, password, fullName, and role are required", 400);
  }

  if (!["student", "umkm", "admin"].includes(role)) {
    throw new AppError("Invalid role. Must be student, umkm, or admin", 400);
  }

  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new AppError("Email already registered", 409);
  }

  const existingPhone = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existingPhone.length > 0) {
    throw new AppError("Phone number already registered", 409);
  }

  const id = generateId();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({ id, email, phone, passwordHash, fullName, role });

  const createdUser = { id, email, phone, fullName, role, passwordHash };

  if (role === "student") {
    await db.insert(students).values({
      id: generateId(),
      userId: id,
      school: profileData.school || "",
      major: profileData.major || "",
      nisn: profileData.nisn,
      graduationYear: profileData.graduationYear,
      bio: profileData.bio,
      skills: profileData.skills ? JSON.parse(JSON.stringify(profileData.skills)) : null,
      portfolioUrl: profileData.portfolioUrl,
      address: profileData.address,
      city: profileData.city,
    });
  }

  if (role === "umkm") {
    await db.insert(umkm).values({
      id: generateId(),
      userId: id,
      businessName: profileData.businessName || "",
      businessType: profileData.businessType || "",
      nib: profileData.nib,
      taxId: profileData.taxId,
      description: profileData.description,
      address: profileData.address,
      city: profileData.city,
      phoneOffice: profileData.phoneOffice,
      website: profileData.website,
    });
  }

  if (role === "admin") {
    const defaultPermissions = ["user:read", "user:write"];

    await db.insert(admins).values({
      id: generateId(),
      userId: id,
      roleLevel: profileData.roleLevel || "support",
      permissions: JSON.parse(JSON.stringify(profileData.permissions || defaultPermissions)),
    });
  }

  const token = signToken(createdUser);

  res.status(201).json({
    message: "Registration successful",
    user: sanitizeUser(createdUser),
    token,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user);

  res.json({
    message: "Login successful",
    user: sanitizeUser(user),
    token,
  });
});

export const me = asyncHandler(async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  let profile = null;

  if (user.role === "student") {
    [profile] = await db.select().from(students).where(eq(students.userId, user.id)).limit(1);
  } else if (user.role === "umkm") {
    [profile] = await db.select().from(umkm).where(eq(umkm.userId, user.id)).limit(1);
  } else if (user.role === "admin") {
    [profile] = await db.select().from(admins).where(eq(admins.userId, user.id)).limit(1);
  }

  res.json({ user: sanitizeUser(user), profile });
});
