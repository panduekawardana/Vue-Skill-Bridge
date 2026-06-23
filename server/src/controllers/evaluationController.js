import crypto from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { evaluations } from "../db/schema/evaluations.js";
import { internships } from "../db/schema/internships.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { users } from "../db/schema/users.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

export const createEvaluation = asyncHandler(async (req, res) => {
  const { internshipId, rating, reviewText, skillAssessment } = req.body;

  if (!internshipId || !rating) {
    throw new AppError("internshipId and rating are required", 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }

  const [internship] = await db.select().from(internships).where(eq(internships.id, internshipId)).limit(1);
  if (!internship) throw new AppError("Internship not found", 404);
  if (internship.status !== "completed") throw new AppError("Can only evaluate completed internships", 400);

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);

  let evaluatorRole;
  if (studentProfile?.id === internship.studentId) {
    evaluatorRole = "student";
  } else if (umkmProfile?.id === internship.umkmId) {
    evaluatorRole = "umkm";
  } else {
    throw new AppError("Forbidden. You are not part of this internship.", 403);
  }

  const existing = await db
    .select()
    .from(evaluations)
    .where(and(eq(evaluations.internshipId, internshipId), eq(evaluations.evaluatorRole, evaluatorRole)))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError("You have already evaluated this internship", 400);
  }

  const id = generateId();

  await db.insert(evaluations).values({
    id,
    internshipId,
    evaluatorRole,
    rating,
    reviewText,
    skillAssessment: skillAssessment ? JSON.parse(JSON.stringify(skillAssessment)) : null,
  });

  const [created] = await db.select().from(evaluations).where(eq(evaluations.id, id)).limit(1);
  res.status(201).json(created);
});

export const getEvaluations = asyncHandler(async (req, res) => {
  const conditions = [];

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.userId, req.user.userId)).limit(1);

  if (req.user.role === "student" && studentProfile) {
    conditions.push(eq(internships.studentId, studentProfile.id));
  } else if (req.user.role === "umkm" && umkmProfile) {
    conditions.push(eq(internships.umkmId, umkmProfile.id));
  }

  const result = await db
    .select({
      id: evaluations.id,
      internshipId: evaluations.internshipId,
      evaluatorRole: evaluations.evaluatorRole,
      rating: evaluations.rating,
      reviewText: evaluations.reviewText,
      skillAssessment: evaluations.skillAssessment,
      createdAt: evaluations.createdAt,
    })
    .from(evaluations)
    .leftJoin(internships, eq(evaluations.internshipId, internships.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(evaluations.createdAt));

  res.json(result);
});

export const getEvaluation = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({
      id: evaluations.id,
      internshipId: evaluations.internshipId,
      evaluatorRole: evaluations.evaluatorRole,
      rating: evaluations.rating,
      reviewText: evaluations.reviewText,
      skillAssessment: evaluations.skillAssessment,
      createdAt: evaluations.createdAt,
    })
    .from(evaluations)
    .where(eq(evaluations.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Evaluation not found", 404);
  res.json(result);
});
