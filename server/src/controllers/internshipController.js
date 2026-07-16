import crypto from "crypto";
import { eq, and, or, desc, sql, gte, lte } from "drizzle-orm";
import { db } from "../config/database.js";
import { internshipNeeds } from "../db/schema/internshipNeeds.js";
import { umkm } from "../db/schema/umkm.js";
import { internships } from "../db/schema/internships.js";
import { matchmaking } from "../db/schema/matchmaking.js";
import { students } from "../db/schema/students.js";
import { users } from "../db/schema/users.js";
import { certificates } from "../db/schema/certificates.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { generateCertificatePdf } from "./certificateController.js";
import { createNotification } from "./notificationController.js";

function generateId() {
  return crypto.randomUUID();
}

// ─── INTERNSHIP NEEDS ──────────────────────────────────────

export const getNeeds = asyncHandler(async (req, res) => {
  const { status, city, major } = req.query;
  const conditions = [];

  if (status) conditions.push(eq(internshipNeeds.status, status));
  if (city) conditions.push(eq(umkm.city, city));
  if (major) conditions.push(eq(internshipNeeds.requiredMajor, major));

  const result = await db
    .select({
      id: internshipNeeds.id,
      umkmId: internshipNeeds.umkmId,
      title: internshipNeeds.title,
      description: internshipNeeds.description,
      requiredSkills: internshipNeeds.requiredSkills,
      requiredMajor: internshipNeeds.requiredMajor,
      slotCount: internshipNeeds.slotCount,
      slotFilled: internshipNeeds.slotFilled,
      durationDays: internshipNeeds.durationDays,
      compensation: internshipNeeds.compensation,
      status: internshipNeeds.status,
      startDate: internshipNeeds.startDate,
      createdAt: internshipNeeds.createdAt,
      businessName: umkm.businessName,
      businessType: umkm.businessType,
      city: umkm.city,
      logoUrl: umkm.logoUrl,
      isVerified: umkm.isVerified,
    })
    .from(internshipNeeds)
    .leftJoin(umkm, eq(internshipNeeds.umkmId, umkm.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(internshipNeeds.createdAt));

  res.json(result);
});

export const getNeed = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: internshipNeeds.id,
      umkmId: internshipNeeds.umkmId,
      title: internshipNeeds.title,
      description: internshipNeeds.description,
      requiredSkills: internshipNeeds.requiredSkills,
      requiredMajor: internshipNeeds.requiredMajor,
      slotCount: internshipNeeds.slotCount,
      slotFilled: internshipNeeds.slotFilled,
      durationDays: internshipNeeds.durationDays,
      compensation: internshipNeeds.compensation,
      status: internshipNeeds.status,
      startDate: internshipNeeds.startDate,
      createdAt: internshipNeeds.createdAt,
      businessName: umkm.businessName,
      businessType: umkm.businessType,
      umkmDescription: umkm.description,
      address: umkm.address,
      city: umkm.city,
      phoneOffice: umkm.phoneOffice,
      website: umkm.website,
      logoUrl: umkm.logoUrl,
    })
    .from(internshipNeeds)
    .leftJoin(umkm, eq(internshipNeeds.umkmId, umkm.id))
    .where(eq(internshipNeeds.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Internship need not found", 404);
  res.json(result);
});

export const createNeed = asyncHandler(async (req, res) => {
  const { title, description, requiredSkills, requiredMajor, slotCount, durationDays, compensation, startDate } = req.body;

  if (!title || !slotCount) {
    throw new AppError("title and slotCount are required", 400);
  }

  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);
  if (!umkmProfile) throw new AppError("UMKM profile not found", 404);

  if (!umkmProfile.isVerified) {
    throw new AppError("UMKM must be verified before posting needs", 403);
  }

  const id = generateId();

  await db.insert(internshipNeeds).values({
    id,
    umkmId: umkmProfile.id,
    title,
    description,
    requiredSkills: requiredSkills ? JSON.parse(JSON.stringify(requiredSkills)) : null,
    requiredMajor,
    slotCount,
    slotFilled: 0,
    durationDays: durationDays || 14,
    compensation,
    startDate: startDate ? new Date(startDate) : null,
  });

  const [created] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, id)).limit(1);
  res.status(201).json(created);
});

export const updateNeed = asyncHandler(async (req, res) => {
  const needId = req.params.id;

  const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, needId)).limit(1);
  if (!need) throw new AppError("Internship need not found", 404);

  if (need.status === "filled") throw new AppError("Cannot edit a filled need", 400);

  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);
  if (need.umkmId !== umkmProfile?.id && req.user.role !== "admin") {
    throw new AppError("Forbidden.", 403);
  }

  const allowed = ["title", "description", "requiredSkills", "requiredMajor", "slotCount", "durationDays", "compensation", "startDate"];
  const updateData = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updateData[key] = key === "requiredSkills" ? JSON.parse(JSON.stringify(req.body[key])) : req.body[key];
    }
  }

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);

  await db.update(internshipNeeds).set(updateData).where(eq(internshipNeeds.id, needId));

  const [updated] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, needId)).limit(1);
  res.json(updated);
});

export const deleteNeed = asyncHandler(async (req, res) => {
  const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, req.params.id)).limit(1);
  if (!need) throw new AppError("Internship need not found", 404);

  await db.delete(internshipNeeds).where(eq(internshipNeeds.id, req.params.id));
  res.json({ message: "Internship need deleted" });
});

export const updateNeedStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["open", "closed", "filled"].includes(status)) {
    throw new AppError("Invalid status. Must be open, closed, or filled", 400);
  }

  const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, req.params.id)).limit(1);
  if (!need) throw new AppError("Internship need not found", 404);

  if (req.user.role === "umkm") {
    const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);
    if (umkmProfile?.id !== need.umkmId) {
      throw new AppError("Forbidden. You can only update your own needs.", 403);
    }
  }

  await db.update(internshipNeeds).set({ status }).where(eq(internshipNeeds.id, req.params.id));
  res.json({ message: `Status updated to ${status}` });
});

// ─── INTERNSHIPS ──────────────────────────────────────────

export const getInternships = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];

  if (status) conditions.push(eq(internships.status, status));

  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);
  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);

  if (req.user.role === "student" && studentProfile) {
    conditions.push(eq(internships.studentId, studentProfile.id));
  } else if (req.user.role === "umkm" && umkmProfile) {
    conditions.push(eq(internships.umkmId, umkmProfile.id));
  }

  const result = await db
    .select({
      id: internships.id,
      matchId: internships.matchId,
      startDate: internships.startDate,
      endDate: internships.endDate,
      status: internships.status,
      completedAt: internships.completedAt,
      studentId: internships.studentId,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      umkmId: internships.umkmId,
      businessName: umkm.businessName,
    })
    .from(internships)
    .leftJoin(students, eq(internships.studentId, students.id))
    .leftJoin(umkm, eq(internships.umkmId, umkm.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(internships.startDate));

  res.json(result);
});

export const getInternship = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: internships.id,
      matchId: internships.matchId,
      studentId: internships.studentId,
      umkmId: internships.umkmId,
      startDate: internships.startDate,
      endDate: internships.endDate,
      status: internships.status,
      dailyLog: internships.dailyLog,
      cancelledAt: internships.cancelledAt,
      cancelReason: internships.cancelReason,
      completedAt: internships.completedAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      studentSkills: students.skills,
      businessName: umkm.businessName,
      businessType: umkm.businessType,
    })
    .from(internships)
    .leftJoin(students, eq(internships.studentId, students.id))
    .leftJoin(umkm, eq(internships.umkmId, umkm.id))
    .leftJoin(users, eq(students.userId, users.id))
    .where(eq(internships.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Internship not found", 404);

  // Ownership check: non-admin users can only view their own internships
  if (req.user.role !== "admin") {
    const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
    const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);
    const isStudentOwner = studentProfile?.id === result.studentId;
    const isUmkmOwner = umkmProfile?.id === result.umkmId;
    if (!isStudentOwner && !isUmkmOwner) {
      throw new AppError("Forbidden. You are not part of this internship.", 403);
    }
  }

  res.json(result);
});

export const updateInternshipStatus = asyncHandler(async (req, res) => {
  const { status, cancelReason } = req.body;
  const valid = ["scheduled", "active", "completed", "cancelled"];
  if (!valid.includes(status)) throw new AppError("Invalid status", 400);

  const [internship] = await db.select().from(internships).where(eq(internships.id, req.params.id)).limit(1);
  if (!internship) throw new AppError("Internship not found", 404);

  if (req.user.role !== "admin") {
    const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
    const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);

    const isStudentOwner = studentProfile?.id === internship.studentId;
    const isUmkmOwner = umkmProfile?.id === internship.umkmId;

    if (!isStudentOwner && !isUmkmOwner) {
      throw new AppError("Forbidden. You are not part of this internship.", 403);
    }
  }

  const updateData = { status };

  if (status === "cancelled") {
    updateData.cancelledAt = new Date();
    updateData.cancelReason = cancelReason || null;

    // Cooling-off period: if cancelled < 2 days before start
    if (internship.startDate) {
      const twoDaysBefore = new Date(internship.startDate);
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
      if (new Date() >= twoDaysBefore) {
        // Set cooling-off for 7 days
        const coolingOffUntil = new Date();
        coolingOffUntil.setDate(coolingOffUntil.getDate() + 7);

        const [studentProfile] = await db.select().from(students).where(eq(students.id, internship.studentId)).limit(1);
        if (studentProfile) {
          await db.update(students).set({ coolingOffUntil }).where(eq(students.id, internship.studentId));
        }

        await createNotification({
          userId: req.user.userId,
          type: "system",
          title: "Periode Pendinginan",
          body: "Anda membatalkan magang kurang dari H-2. Anda tidak dapat menerima match baru selama 7 hari.",
          referenceId: internship.id,
        });
      }
    }
  }

  if (status === "completed") {
    if (internship.status !== "active") {
      throw new AppError("Only active internships can be completed", 400);
    }
    updateData.completedAt = new Date();
  }

  if (status === "active") {
    // FIX BUG: use database startDate, not empty updateData
    updateData.startDate = internship.startDate || new Date();
  }

  // Validate transition: scheduled → active → completed
  const allowedTransitions = {
    scheduled: ["active", "cancelled"],
    active: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (!allowedTransitions[internship.status]?.includes(status)) {
    throw new AppError(`Cannot transition from ${internship.status} to ${status}`, 400);
  }

  await db.update(internships).set(updateData).where(eq(internships.id, req.params.id));

  // Send status change notification
  const statusMsg = {
    active: { title: "Magang Dimulai", body: "Status magang Anda telah berubah menjadi aktif." },
    completed: { title: "Magang Selesai", body: "Selamat! Magang Anda telah selesai. Sertifikat sedang disiapkan." },
    cancelled: { title: "Magang Dibatalkan", body: "Status magang Anda telah dibatalkan." },
  };

  if (statusMsg[status]) {
    // Fix: join to get user ID instead of using studentId (students.id)
    const [studentUser] = await db
      .select({ userId: users.id })
      .from(users)
      .innerJoin(students, eq(users.id, students.userId))
      .where(eq(students.id, internship.studentId))
      .limit(1);

    if (studentUser) {
      await createNotification({
        userId: studentUser.userId,
        type: status === "completed" ? "certificate" : "schedule",
        title: statusMsg[status].title,
        body: statusMsg[status].body,
        referenceId: internship.id,
      });
    }
  }

  if (status === "completed") {
    const actualDuration = Math.round(
      (new Date(internship.endDate || Date.now()) - new Date(internship.startDate || Date.now()))
      / (1000 * 60 * 60 * 24),
    );
    const certId = generateId();
    const certNumber = `SB-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const metadata = { duration: `${Math.max(1, actualDuration)} days`, issuedVia: "auto" };

    await db.insert(certificates).values({
      id: certId,
      studentId: internship.studentId,
      internshipId: internship.id,
      certificateNumber: certNumber,
      metadata: JSON.parse(JSON.stringify(metadata)),
    });

    // Generate PDF asynchronously
    try {
      const [studentRecord] = await db
        .select({
          studentName: users.fullName,
          studentSchool: students.school,
          studentMajor: students.major,
        })
        .from(students)
        .leftJoin(users, eq(students.userId, users.id))
        .where(eq(students.id, internship.studentId))
        .limit(1);

      const [umkmRecord] = await db
        .select({ businessName: umkm.businessName })
        .from(umkm)
        .where(eq(umkm.id, internship.umkmId))
        .limit(1);

      const pdfRecord = {
        certificateNumber: certNumber,
        studentName: studentRecord?.studentName,
        studentSchool: studentRecord?.studentSchool,
        studentMajor: studentRecord?.studentMajor,
        businessName: umkmRecord?.businessName,
        metadata,
        issuedAt: new Date(),
      };

      const filePath = await generateCertificatePdf(pdfRecord);
      if (filePath) {
        await db.update(certificates).set({ fileUrl: filePath }).where(eq(certificates.id, certId));
      }
    } catch (err) {
      console.error("Certificate PDF generation failed:", err.message);
    }
  }

  res.json({ message: `Internship ${status}` });
});

export const addDailyLog = asyncHandler(async (req, res) => {
  const { content, date } = req.body;

  if (!content) throw new AppError("content is required", 400);

  const [internship] = await db.select().from(internships).where(eq(internships.id, req.params.id)).limit(1);
  if (!internship) throw new AppError("Internship not found", 404);

  if (internship.status !== "active") {
    throw new AppError("Can only add daily logs to active internships", 400);
  }

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  if (studentProfile?.id !== internship.studentId) {
    throw new AppError("Forbidden. Only the assigned student can add daily logs.", 403);
  }

  const currentLog = Array.isArray(internship.dailyLog) ? internship.dailyLog : [];
  const newEntry = {
    id: generateId().slice(0, 8),
    date: date || new Date().toISOString().split("T")[0],
    content,
    createdAt: new Date(),
  };

  await db
    .update(internships)
    .set({ dailyLog: JSON.parse(JSON.stringify([...currentLog, newEntry])) })
    .where(eq(internships.id, req.params.id));

  res.status(201).json(newEntry);
});
