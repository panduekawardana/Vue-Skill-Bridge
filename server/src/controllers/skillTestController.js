import crypto from "crypto";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { skillTestQuestions } from "../db/schema/skillTestQuestions.js";
import { skillTestAttempts } from "../db/schema/skillTestAttempts.js";
import { skillTestAnswers } from "../db/schema/skillTestAnswers.js";
import { skillTestResults } from "../db/schema/skillTestResults.js";
import { students } from "../db/schema/students.js";
import { admins } from "../db/schema/admins.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { autoMatchFromTestResults } from "./matchmakingController.js";
import { createNotification } from "./notificationController.js";

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

  const [adminRecord] = await db.select().from(admins).where(eq(admins.userId, req.user.userId)).limit(1);

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
    createdBy: adminRecord?.id || null,
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

  const [activeAttempt] = await db
    .select()
    .from(skillTestAttempts)
    .where(
      and(
        eq(skillTestAttempts.studentId, studentProfile.id),
        eq(skillTestAttempts.status, "in_progress"),
      ),
    )
    .limit(1);

  if (activeAttempt) {
    const timeLimit = 15 * 60 * 1000;
    const elapsed = Date.now() - new Date(activeAttempt.startedAt).getTime();

    if (elapsed >= timeLimit) {
      await db
        .update(skillTestAttempts)
        .set({ status: "expired", completedAt: new Date() })
        .where(eq(skillTestAttempts.id, activeAttempt.id));
    } else {
      throw new AppError("You already have an active attempt. Complete it first.", 400);
    }
  }

  // Adaptive stratification: select questions by difficulty distribution
  const allActive = await db
    .select()
    .from(skillTestQuestions)
    .where(eq(skillTestQuestions.isActive, true));

  const byDifficulty = { beginner: [], intermediate: [], advanced: [] };
  for (const q of allActive) {
    if (byDifficulty[q.difficulty]) byDifficulty[q.difficulty].push(q);
  }

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pick = (pool, count) => shuffle(pool).slice(0, Math.min(count, pool.length));

  let selected = [
    ...pick(byDifficulty.beginner, 8),
    ...pick(byDifficulty.intermediate, 7),
    ...pick(byDifficulty.advanced, 5),
  ];

  // Fallback if not enough questions in some difficulty
  if (selected.length < 20) {
    const usedIds = new Set(selected.map((q) => q.id));
    const remaining = allActive.filter((q) => !usedIds.has(q.id));
    selected = [...selected, ...pick(remaining, 20 - selected.length)];
  }

  const id = generateId();

  await db.insert(skillTestAttempts).values({
    id,
    studentId: studentProfile.id,
    startedAt: new Date(),
    status: "in_progress",
    questionIds: JSON.parse(JSON.stringify(selected.map((q) => q.id))),
  });

  const questions = shuffle(selected).map(({ correctAnswer, ...q }) => q);

  res.status(201).json({ attemptId: id, questions, timeLimit: 15 });
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

  if (req.user.role !== "admin") {
    const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
    if (studentProfile?.id !== attempt.studentId) {
      throw new AppError("Forbidden. You can only view your own attempts.", 403);
    }
  }

  const answers = await db
    .select()
    .from(skillTestAnswers)
    .where(eq(skillTestAnswers.attemptId, attempt.id));

  const questionIds = answers.map((a) => a.questionId);

  // If in_progress, also return unanswered questions for resume
  if (attempt.status === "in_progress") {
    const assignedIds = Array.isArray(attempt.questionIds)
      ? attempt.questionIds
      : (typeof attempt.questionIds === "string" ? JSON.parse(attempt.questionIds) : null);

    if (assignedIds && assignedIds.length > 0) {
      const questions = await db
        .select()
        .from(skillTestQuestions)
        .where(inArray(skillTestQuestions.id, assignedIds))
        .map(({ correctAnswer, ...q }) => q);
      return res.json({ attempt, answers, questions, resume: true });
    }

    // Fallback: no stored questionIds (legacy data) — return answered questions only
    if (questionIds.length > 0) {
      const questions = await db
        .select()
        .from(skillTestQuestions)
        .where(inArray(skillTestQuestions.id, questionIds))
        .map(({ correctAnswer, ...q }) => q);
      return res.json({ attempt, answers, questions, resume: true });
    }

    return res.json({ attempt, answers, questions: [], resume: true });
  }

  const questions = await db
    .select()
    .from(skillTestQuestions)
    .where(inArray(skillTestQuestions.id, questionIds));

  res.json({ attempt, answers, questions, resume: false });
});

const ESSAY_KEYWORDS = {
  "perbedaan var let const": ["scope", "hoisting", "reassign", "temporal dead zone", "tdz", "block", "function"],
  "perbedaan jurnal umum dan buku besar": ["jurnal", "buku besar", "posting", "chronic", "rangkum", "ledger"],
  "jelaskan": ["karena", "sehingga", "yaitu", "adalah", "pertama", "kedua"],
};

function gradeEssay(questionText, answerText, pointValue) {
  const lowerQ = questionText.toLowerCase();
  const lowerA = answerText.toLowerCase();
  let matched = 0;

  const keywords = Object.entries(ESSAY_KEYWORDS).find(([key]) => lowerQ.includes(key));
  const words = keywords ? keywords[1] : [];

  if (words.length === 0) {
    const wordCount = lowerA.split(/\s+/).filter(Boolean).length;
    matched = wordCount >= 30 ? 3 : wordCount >= 20 ? 2 : wordCount >= 10 ? 1 : 0;
  } else {
    for (const w of words) {
      if (lowerA.includes(w)) matched++;
    }
  }

  const ratio = words.length > 0 ? matched / words.length : matched / 3;
  const score = Math.round(Math.min(1, ratio) * pointValue);
  return { score, isCorrect: score >= Math.ceil(pointValue * 0.5) };
}

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

  // Server-side timeout check
  const timeLimit = 15 * 60 * 1000;
  const elapsed = Date.now() - new Date(attempt.startedAt).getTime();
  if (elapsed >= timeLimit) {
    await db
      .update(skillTestAttempts)
      .set({ status: "expired", completedAt: new Date() })
      .where(eq(skillTestAttempts.id, attempt.id));
    throw new AppError("Time limit exceeded", 400);
  }

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  if (studentProfile?.id !== attempt.studentId) {
    throw new AppError("Forbidden. You can only submit your own attempts.", 403);
  }

  const questionIds = answers.map((a) => a.questionId);
  const allQuestions = await db
    .select()
    .from(skillTestQuestions)
    .where(inArray(skillTestQuestions.id, questionIds));

  const questionMap = {};
  for (const q of allQuestions) {
    questionMap[q.id] = q;
  }

  const categoryGroups = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const ans of answers) {
    const question = questionMap[ans.questionId];
    if (!question) continue;

    let isCorrect = null;
    let score = 0;

    if (question.questionType === "multiple_choice" && question.correctAnswer) {
      isCorrect = ans.answerText === question.correctAnswer;
      score = isCorrect ? question.pointValue : 0;
    } else if (question.questionType === "essay") {
      const result = gradeEssay(question.questionText, ans.answerText, question.pointValue || 10);
      isCorrect = result.isCorrect;
      score = result.score;
    } else if (question.questionType === "coding") {
      // Coding questions: check if answer contains code-like content
      const hasCode = ans.answerText && ans.answerText.trim().length > 10;
      const hasKeywords = question.correctAnswer
        ? question.correctAnswer.toLowerCase().split(/[,\s]+/).filter(w => w.length > 2).some(kw => ans.answerText.toLowerCase().includes(kw))
        : false;
      score = hasCode ? (hasKeywords ? question.pointValue : Math.round(question.pointValue * 0.5)) : 0;
      isCorrect = score >= Math.ceil((question.pointValue || 10) * 0.5);
    }

    await db.insert(skillTestAnswers).values({
      id: generateId(),
      attemptId: attempt.id,
      questionId: ans.questionId,
      answerText: ans.answerText,
      isCorrect,
      scoreObtained: score,
      answeredAt: new Date(),
    });

    totalScore += score;
    maxScore += question.pointValue || 10;

    const cat = question.category || "Uncategorized";
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = { score: 0, max: 0 };
    }
    categoryGroups[cat].score += score;
    categoryGroups[cat].max += question.pointValue || 10;
  }

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const skillBreakdown = {};
  for (const [cat, data] of Object.entries(categoryGroups)) {
    skillBreakdown[cat] = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
  }

  let adaptiveLevel = "beginner";
  if (overallScore >= 71) adaptiveLevel = "advanced";
  else if (overallScore >= 41) adaptiveLevel = "intermediate";

  const recommendedRoles = [];
  const highSkillCategories = Object.entries(skillBreakdown)
    .filter(([, score]) => score >= 60)
    .sort(([, a], [, b]) => b - a);

  const roleMap = {
    Programming: "Software Developer",
    Design: "UI/UX Designer",
    "Desain Grafis": "Graphic Designer",
    Akuntansi: "Staff Akuntansi",
    Pemasaran: "Digital Marketing",
    Administrasi: "Admin Perkantoran",
    Multimedia: "Multimedia Designer",
    Jaringan: "Network Technician",
    Database: "Database Administrator",
  };

  for (const [cat] of highSkillCategories) {
    if (roleMap[cat] && !recommendedRoles.includes(roleMap[cat])) {
      recommendedRoles.push(roleMap[cat]);
    }
  }

  if (studentProfile?.major) {
    const majorRoles = {
      "Rekayasa Perangkat Lunak": "Junior Developer",
      "Teknik Komputer dan Jaringan": "IT Support",
      Multimedia: "Graphic Designer",
      Akuntansi: "Staff Akuntansi",
      "Administrasi Perkantoran": "Administration Staff",
      Pemasaran: "Marketing Support",
      BDP: "Marketing Staff",
      AKL: "Junior Accountant",
      TKJ: "Technical Support",
      RPL: "Software Developer",
      MM: "Multimedia Designer",
    };
    if (majorRoles[studentProfile.major] && !recommendedRoles.includes(majorRoles[studentProfile.major])) {
      recommendedRoles.push(majorRoles[studentProfile.major]);
    }
  }

  if (recommendedRoles.length === 0) {
    recommendedRoles.push("Junior Trainee");
  }

  await db
    .update(skillTestAttempts)
    .set({
      status: "completed",
      completedAt: new Date(),
      totalScore: overallScore,
      adaptiveLevel,
    })
    .where(eq(skillTestAttempts.id, attempt.id));

  await db.insert(skillTestResults).values({
    id: generateId(),
    studentId: attempt.studentId,
    attemptId: attempt.id,
    overallScore,
    skillBreakdown,
    recommendedRoles,
  });

  // Notification
  try {
    await createNotification({
      userId: req.user.userId,
      type: "system",
      title: "Skill Test Selesai!",
      body: `Skor kamu: ${overallScore}. Kami akan mencari magang yang cocok dengan hasil tes kamu.`,
      referenceId: attempt.id,
    });
  } catch (_err) { /* non-blocking */ }

  // Auto-matchmaking from test results
  let autoMatches = [];
  try {
    autoMatches = await autoMatchFromTestResults(attempt.studentId, skillBreakdown, recommendedRoles);
  } catch (err) {
    console.error("Auto-match error:", err.message);
  }

  res.json({
    message: "Attempt submitted",
    score: overallScore,
    skillBreakdown,
    recommendedRoles,
    autoMatches,
  });
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

  if (req.user.role !== "admin") {
    const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
    if (studentProfile?.id !== result.studentId) {
      throw new AppError("Forbidden. You can only view your own results.", 403);
    }
  }

  const [attempt] = await db
    .select()
    .from(skillTestAttempts)
    .where(eq(skillTestAttempts.id, result.attemptId))
    .limit(1);

  res.json({ ...result, attempt });
});
