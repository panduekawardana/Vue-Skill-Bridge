import crypto from "crypto";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../config/database.js";
import { skillTestQuestions } from "../db/schema/skillTestQuestions.js";
import { skillTestAttempts } from "../db/schema/skillTestAttempts.js";
import { skillTestAnswers } from "../db/schema/skillTestAnswers.js";
import { skillTestResults } from "../db/schema/skillTestResults.js";
import { students } from "../db/schema/students.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

// ─── QUESTIONS ──────────────────────────────────────────────

export const getQuestions = asyncHandler(async (req, res) => {
  const { category, difficulty, tags } = req.query;
  const conditions = [eq(skillTestQuestions.isActive, true)];

  if (category) conditions.push(eq(skillTestQuestions.category, category));
  if (difficulty) conditions.push(eq(skillTestQuestions.difficulty, difficulty));

  const result = await db
    .select()
    .from(skillTestQuestions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(skillTestQuestions.category);

  res.json(result);
});

export const getQuestion = asyncHandler(async (req, res) => {
  const [result] = await db
    .select()
    .from(skillTestQuestions)
    .where(eq(skillTestQuestions.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Question not found", 404);
  res.json(result);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { category, difficulty, questionText, questionType, options, correctAnswer, pointValue, tags } = req.body;

  if (!category || !difficulty || !questionText || !questionType) {
    throw new AppError("category, difficulty, questionText, and questionType are required", 400);
  }

  const id = generateId();

  await db.insert(skillTestQuestions).values({
    id,
    category,
    difficulty,
    questionText,
    questionType,
    options: options ? JSON.parse(JSON.stringify(options)) : null,
    correctAnswer,
    pointValue: pointValue || 10,
    tags: tags ? JSON.parse(JSON.stringify(tags)) : null,
    createdBy: req.user.userId,
  });

  const [created] = await db.select().from(skillTestQuestions).where(eq(skillTestQuestions.id, id)).limit(1);
  res.status(201).json(created);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const [q] = await db.select().from(skillTestQuestions).where(eq(skillTestQuestions.id, req.params.id)).limit(1);
  if (!q) throw new AppError("Question not found", 404);

  const allowed = ["category", "difficulty", "questionText", "questionType", "options", "correctAnswer", "pointValue", "tags", "isActive"];
  const updateData = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updateData[key] = ["options", "tags"].includes(key)
        ? JSON.parse(JSON.stringify(req.body[key]))
        : req.body[key];
    }
  }

  if (Object.keys(updateData).length === 0) throw new AppError("No valid fields to update", 400);

  await db.update(skillTestQuestions).set(updateData).where(eq(skillTestQuestions.id, req.params.id));

  const [updated] = await db.select().from(skillTestQuestions).where(eq(skillTestQuestions.id, req.params.id)).limit(1);
  res.json(updated);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const [q] = await db.select().from(skillTestQuestions).where(eq(skillTestQuestions.id, req.params.id)).limit(1);
  if (!q) throw new AppError("Question not found", 404);

  await db.update(skillTestQuestions).set({ isActive: false }).where(eq(skillTestQuestions.id, req.params.id));
  res.json({ message: "Question deactivated" });
});

// ─── ATTEMPTS ──────────────────────────────────────────────

export const startAttempt = asyncHandler(async (req, res) => {
  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  if (!studentProfile) throw new AppError("Student profile not found", 404);

  const activeAttempt = await db
    .select()
    .from(skillTestAttempts)
    .where(
      and(
        eq(skillTestAttempts.studentId, studentProfile.id),
        eq(skillTestAttempts.status, "in_progress"),
      ),
    )
    .limit(1);

  if (activeAttempt.length > 0) {
    throw new AppError("You already have an active attempt. Complete it first.", 400);
  }

  const id = generateId();

  await db.insert(skillTestAttempts).values({
    id,
    studentId: studentProfile.id,
    startedAt: new Date(),
    status: "in_progress",
  });

  const questions = await db
    .select()
    .from(skillTestQuestions)
    .where(eq(skillTestQuestions.isActive, true))
    .orderBy(sql`RAND()`)
    .limit(20);

  res.status(201).json({ attemptId: id, questions });
});

export const getAttempts = asyncHandler(async (req, res) => {
  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);

  const result = await db
    .select()
    .from(skillTestAttempts)
    .where(eq(skillTestAttempts.studentId, studentProfile?.id || ""))
    .orderBy(desc(skillTestAttempts.startedAt));

  res.json(result);
});

export const getAttempt = asyncHandler(async (req, res) => {
  const [attempt] = await db
    .select()
    .from(skillTestAttempts)
    .where(eq(skillTestAttempts.id, req.params.id))
    .limit(1);

  if (!attempt) throw new AppError("Attempt not found", 404);

  const answers = await db
    .select()
    .from(skillTestAnswers)
    .where(eq(skillTestAnswers.attemptId, attempt.id));

  const questions = await db
    .select()
    .from(skillTestQuestions)
    .where(
      inArray(
        skillTestQuestions.id,
        answers.map((a) => a.questionId),
      ),
    );

  res.json({ attempt, answers, questions });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    throw new AppError("answers array is required", 400);
  }

  const [attempt] = await db
    .select()
    .from(skillTestAttempts)
    .where(eq(skillTestAttempts.id, req.params.id))
    .limit(1);

  if (!attempt) throw new AppError("Attempt not found", 404);
  if (attempt.status !== "in_progress") throw new AppError("Attempt already completed or expired", 400);

  let totalScore = 0;
  let answeredCount = 0;

  for (const ans of answers) {
    const questionId = ans.questionId;
    const answerText = ans.answerText;

    const [question] = await db
      .select()
      .from(skillTestQuestions)
      .where(eq(skillTestQuestions.id, questionId))
      .limit(1);

    if (!question) continue;

    let isCorrect = null;
    let score = 0;

    if (question.questionType === "multiple_choice" && question.correctAnswer) {
      isCorrect = answerText === question.correctAnswer;
      score = isCorrect ? question.pointValue : 0;
    }

    await db.insert(skillTestAnswers).values({
      id: generateId(),
      attemptId: attempt.id,
      questionId,
      answerText,
      isCorrect,
      scoreObtained: score,
      answeredAt: new Date(),
    });

    totalScore += score;
    answeredCount++;
  }

  const maxScore = answeredCount * 10;
  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  await db
    .update(skillTestAttempts)
    .set({
      status: "completed",
      completedAt: new Date(),
      totalScore: overallScore,
    })
    .where(eq(skillTestAttempts.id, attempt.id));

  await db.insert(skillTestResults).values({
    id: generateId(),
    studentId: attempt.studentId,
    attemptId: attempt.id,
    overallScore,
    skillBreakdown: JSON.parse("{}"),
    recommendedRoles: JSON.parse("[]"),
  });

  res.json({ message: "Attempt submitted", score: overallScore });
});

// ─── RESULTS ────────────────────────────────────────────────

export const getResults = asyncHandler(async (req, res) => {
  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);

  const result = await db
    .select()
    .from(skillTestResults)
    .where(eq(skillTestResults.studentId, studentProfile?.id || ""))
    .orderBy(desc(skillTestResults.createdAt));

  res.json(result);
});

export const getResult = asyncHandler(async (req, res) => {
  const [result] = await db
    .select()
    .from(skillTestResults)
    .where(eq(skillTestResults.id, req.params.id))
    .limit(1);

  if (!result) throw new AppError("Result not found", 404);

  const [attempt] = await db
    .select()
    .from(skillTestAttempts)
    .where(eq(skillTestAttempts.id, result.attemptId))
    .limit(1);

  res.json({ ...result, attempt });
});
