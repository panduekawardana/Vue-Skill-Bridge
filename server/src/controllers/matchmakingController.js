import crypto from "crypto";
import { eq, and, or, desc, isNull, inArray } from "drizzle-orm";
import { db } from "../config/database.js";
import { matchmaking } from "../db/schema/matchmaking.js";
import { internshipNeeds } from "../db/schema/internshipNeeds.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { users } from "../db/schema/users.js";
import { internships } from "../db/schema/internships.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

export const getMatches = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];

  if (status) conditions.push(eq(matchmaking.status, status));

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);

  if (req.user.role === "student" && studentProfile) {
    conditions.push(eq(matchmaking.studentId, studentProfile.id));
  } else if (req.user.role === "umkm" && umkmProfile) {
    const umkmNeedIds = await db
      .select({ id: internshipNeeds.id })
      .from(internshipNeeds)
      .where(eq(internshipNeeds.umkmId, umkmProfile.id));
    if (umkmNeedIds.length > 0) {
      conditions.push(inArray(matchmaking.needId, umkmNeedIds.map((n) => n.id)));
    } else {
      conditions.push(eq(matchmaking.id, ""));
    }
  }

  const result = await db
    .select({
      id: matchmaking.id,
      studentId: matchmaking.studentId,
      needId: matchmaking.needId,
      matchScore: matchmaking.matchScore,
      matchDetails: matchmaking.matchDetails,
      status: matchmaking.status,
      studentResponse: matchmaking.studentResponse,
      umkmResponse: matchmaking.umkmResponse,
      matchedAt: matchmaking.matchedAt,
      respondedAt: matchmaking.respondedAt,
      createdAt: matchmaking.createdAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      studentSkills: students.skills,
      needTitle: internshipNeeds.title,
      businessName: umkm.businessName,
    })
    .from(matchmaking)
    .leftJoin(students, eq(matchmaking.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(internshipNeeds, eq(matchmaking.needId, internshipNeeds.id))
    .leftJoin(umkm, eq(internshipNeeds.umkmId, umkm.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(matchmaking.matchScore));

  res.json(result);
});

export const getMatch = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: matchmaking.id,
      studentId: matchmaking.studentId,
      needId: matchmaking.needId,
      matchScore: matchmaking.matchScore,
      matchDetails: matchmaking.matchDetails,
      status: matchmaking.status,
      studentResponse: matchmaking.studentResponse,
      umkmResponse: matchmaking.umkmResponse,
      matchedAt: matchmaking.matchedAt,
      respondedAt: matchmaking.respondedAt,
      createdAt: matchmaking.createdAt,
      studentName: users.fullName,
      studentSchool: students.school,
      studentMajor: students.major,
      studentSkills: students.skills,
      studentBio: students.bio,
      needTitle: internshipNeeds.title,
      needDescription: internshipNeeds.description,
      businessName: umkm.businessName,
      businessType: umkm.businessType,
    })
    .from(matchmaking)
    .leftJoin(students, eq(matchmaking.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(internshipNeeds, eq(matchmaking.needId, internshipNeeds.id))
    .leftJoin(umkm, eq(internshipNeeds.umkmId, umkm.id))
    .where(eq(matchmaking.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Match not found", 404);
  res.json(result);
});

export const respondToMatch = asyncHandler(async (req, res) => {
  const { response } = req.body;

  if (!["accepted", "rejected"].includes(response)) {
    throw new AppError("response must be 'accepted' or 'rejected'", 400);
  }

  const [match] = await db.select().from(matchmaking).where(eq(matchmaking.id, req.params.id)).limit(1);
  if (!match) throw new AppError("Match not found", 404);
  if (match.status !== "pending") throw new AppError("Match already responded", 400);

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);

  if (req.user.role === "student" && studentProfile?.id === match.studentId) {
    const updateData = { studentResponse: response, respondedAt: new Date() };

    if (response === "rejected") {
      updateData.status = "rejected";
    }

    await db.update(matchmaking).set(updateData).where(eq(matchmaking.id, match.id));

    if (response === "accepted" && match.umkmResponse === "accepted") {
      await db.update(matchmaking).set({ status: "accepted", matchedAt: new Date() }).where(eq(matchmaking.id, match.id));
      await createInternshipFromMatch(match);
    }
  } else {
    const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);
    const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, match.needId)).limit(1);

    if (umkmProfile?.id !== need?.umkmId) {
      throw new AppError("Forbidden.", 403);
    }

    const updateData = { umkmResponse: response, respondedAt: new Date() };

    if (response === "rejected") {
      updateData.status = "rejected";
    }

    await db.update(matchmaking).set(updateData).where(eq(matchmaking.id, match.id));

    if (response === "accepted" && match.studentResponse === "accepted") {
      await db.update(matchmaking).set({ status: "accepted", matchedAt: new Date() }).where(eq(matchmaking.id, match.id));
      await createInternshipFromMatch(match);
    }
  }

  const [updated] = await db.select().from(matchmaking).where(eq(matchmaking.id, match.id)).limit(1);
  res.json(updated);
});

async function createInternshipFromMatch(match) {
  const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, match.needId)).limit(1);
  if (!need) return;

  const startDate = need.startDate || new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (need.durationDays || 14));

  await db.insert(internships).values({
    id: generateId(),
    matchId: match.id,
    studentId: match.studentId,
    umkmId: need.umkmId,
    startDate,
    endDate,
    status: "scheduled",
  });

  await db
    .update(internshipNeeds)
    .set({ slotFilled: need.slotFilled + 1 })
    .where(eq(internshipNeeds.id, need.id));

  const [updatedNeed] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, need.id)).limit(1);
  if (updatedNeed && updatedNeed.slotFilled >= updatedNeed.slotCount) {
    await db.update(internshipNeeds).set({ status: "filled" }).where(eq(internshipNeeds.id, need.id));
  }
}

export const createMatch = asyncHandler(async (req, res) => {
  const { studentId, needId, matchScore, matchDetails } = req.body;

  if (!studentId || !needId) {
    throw new AppError("studentId and needId are required", 400);
  }

  const id = generateId();

  await db.insert(matchmaking).values({
    id,
    studentId,
    needId,
    matchScore: matchScore || null,
    matchDetails: matchDetails ? JSON.parse(JSON.stringify(matchDetails)) : null,
  });

  const [created] = await db.select().from(matchmaking).where(eq(matchmaking.id, id)).limit(1);
  res.status(201).json(created);
});
