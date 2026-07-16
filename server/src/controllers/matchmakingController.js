import crypto from "crypto";
import { eq, and, or, desc, isNull, inArray, lte, gte, ne, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { matchmaking } from "../db/schema/matchmaking.js";
import { internshipNeeds } from "../db/schema/internshipNeeds.js";
import { students } from "../db/schema/students.js";
import { umkm } from "../db/schema/umkm.js";
import { users } from "../db/schema/users.js";
import { internships } from "../db/schema/internships.js";
import { skillTestResults } from "../db/schema/skillTestResults.js";
import { admins } from "../db/schema/admins.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createNotification } from "./notificationController.js";

function generateId() {
  return crypto.randomUUID();
}

const SKILL_SYNONYMS = {
  javascript: ["js", "ecmascript", "es6", "nodejs", "node.js", "node"],
  typescript: ["ts"],
  python: ["py"],
  php: ["php"],
  "vue.js": ["vue", "vuejs", "vue2", "vue3"],
  react: ["reactjs", "react.js"],
  laravel: ["laravel"],
  mysql: ["sql", "mariadb", "database"],
  photoshop: ["ps", "adobe photoshop"],
  illustrator: ["ai", "adobe illustrator"],
  canva: ["canva"],
  excel: ["ms excel", "microsoft excel", "spreadsheet"],
  myob: ["myob"],
  networking: ["jaringan", "network", "cisco", "mikrotik"],
  "ui design": ["ui/ux", "uiux", "user interface", "figma", "xd"],
  "digital marketing": ["marketing", "pemasaran", "social media", "sosmed"],
  copywriting: ["copywriting", "copy write", "content writing"],
};

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(SKILL_SYNONYMS)) {
    if (lower === canonical || aliases.includes(lower)) return canonical;
  }
  return lower;
}

function matchSkills(studentSkills, requiredSkills) {
  const normalized = (studentSkills || []).map(normalizeSkill);
  const required = (requiredSkills || []).map(normalizeSkill);

  if (required.length === 0) return 50;
  if (normalized.length === 0) return 0;

  const matched = normalized.filter((s) =>
    required.some((rs) => s === rs || (s.length > 2 && rs.length > 2 && (rs.includes(s) || s.includes(rs)))),
  );

  return Math.min(100, Math.round((matched.length / required.length) * 100));
}

// Map individual skills to test categories for cross-referencing test scores
const SKILL_TO_CATEGORY = {
  javascript: "Programming", js: "Programming", typescript: "Programming",
  python: "Programming", php: "Programming", java: "Programming",
  "c#": "Programming", "c++": "Programming", go: "Programming",
  html: "Programming", css: "Programming", nodejs: "Programming",
  react: "Programming", vue: "Programming", angular: "Programming",
  laravel: "Programming", codeigniter: "Programming",
  photoshop: "Desain Grafis", illustrator: "Desain Grafis",
  canva: "Desain Grafis", coreldraw: "Desain Grafis",
  figma: "Desain Grafis", "ui design": "Desain Grafis",
  "after effects": "Multimedia", premiere: "Multimedia",
  "video editing": "Multimedia", animation: "Multimedia",
  myob: "Akuntansi", accurate: "Akuntansi",
  akuntansi: "Akuntansi", accounting: "Akuntansi",
  "digital marketing": "Pemasaran", pemasaran: "Pemasaran",
  copywriting: "Pemasaran", "social media": "Pemasaran",
  seo: "Pemasaran", marketing: "Pemasaran",
  excel: "Administrasi", spreadsheet: "Administrasi",
  word: "Administrasi", "microsoft office": "Administrasi",
  networking: "Jaringan", cisco: "Jaringan",
  mikrotik: "Jaringan", network: "Jaringan",
  mysql: "Database", postgresql: "Database",
  mongodb: "Database", sql: "Database",
  database: "Database",
};

function computeMatchScore({
  studentSkills, requiredSkills,
  studentMajor, requiredMajor,
  studentCity, umkmCity,
  skillBreakdown, recommendedRoles,
  needTitle, overallScore,
}) {
  const skillMatch = matchSkills(studentSkills, requiredSkills);

  let majorMatch = 50;
  if (requiredMajor && studentMajor) {
    const nm = requiredMajor.toLowerCase().trim();
    const sm = studentMajor.toLowerCase().trim();
    majorMatch = nm === sm ? 100 : (nm.includes(sm) || sm.includes(nm) ? 70 : 30);
  }

  let testPerformance = (overallScore != null) ? overallScore : 50;
  if (skillBreakdown && requiredSkills && requiredSkills.length > 0) {
    const relevantScores = [];
    for (const skill of requiredSkills) {
      const cat = SKILL_TO_CATEGORY[normalizeSkill(skill)];
      if (cat && skillBreakdown[cat] !== undefined) {
        relevantScores.push(skillBreakdown[cat]);
      }
    }
    if (relevantScores.length > 0) {
      testPerformance = Math.round(
        relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length,
      );
    }
  }

  let roleFit = 50;
  if (recommendedRoles && recommendedRoles.length > 0 && needTitle) {
    const titleLower = needTitle.toLowerCase();
    const hasMatch = recommendedRoles.some((role) => {
      const words = role.toLowerCase().split(/\s+/);
      return words.some((w) => w.length > 2 && titleLower.includes(w));
    });
    roleFit = hasMatch ? 100 : 30;
  }

  let locationMatch = 50;
  if (studentCity && umkmCity) {
    locationMatch = studentCity.toLowerCase() === umkmCity.toLowerCase() ? 100 : 40;
  }

  const matchScore = Math.round(
    skillMatch * 0.35 + majorMatch * 0.20 + testPerformance * 0.25 + roleFit * 0.10 + locationMatch * 0.10,
  );

  return {
    matchScore,
    matchDetails: { skillMatch, majorMatch, testPerformance, roleFit, locationMatch },
  };
}

export const getMatches = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];

  if (status) {
    conditions.push(eq(matchmaking.status, status));
  } else {
    conditions.push(ne(matchmaking.status, "expired"));
  }

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
      source: matchmaking.source,
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

  // ─── ADMIN OVERRIDE (bypasses status check) ─────────────
  if (req.user.role === "admin") {
    const [adminRecord] = await db.select().from(admins).where(eq(admins.userId, req.user.userId)).limit(1);
    const canOverride = adminRecord?.permissions?.includes("match:override");

    if (!canOverride) throw new AppError("Forbidden. No match:override permission.", 403);

    if (response === "rejected") {
      await db.update(matchmaking).set({
        status: "rejected",
        studentResponse: "rejected",
        umkmResponse: "rejected",
        respondedAt: new Date(),
      }).where(eq(matchmaking.id, match.id));
    } else {
      await db.update(matchmaking).set({
        status: "accepted",
        studentResponse: "accepted",
        umkmResponse: "accepted",
        matchedAt: new Date(),
        respondedAt: new Date(),
      }).where(eq(matchmaking.id, match.id));

      await createInternshipFromMatch(match);
    }

    const [updated] = await db.select().from(matchmaking).where(eq(matchmaking.id, match.id)).limit(1);

    // Notify both parties
    try {
      const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, match.needId)).limit(1);
      const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.id, need?.umkmId)).limit(1);
      const [studentUser] = await db.select({ userId: users.id }).from(users).innerJoin(students, eq(users.id, students.userId)).where(eq(students.id, match.studentId)).limit(1);

      const verb = response === "accepted" ? "menerima" : "menolak";
      const title = `Lamaran ${response === "accepted" ? "Diterima" : "Ditolak"} (Admin)`;
      const body = `Admin telah ${verb} lamaran magang atas nama Anda.`;

      if (studentUser) {
        await createNotification({ userId: studentUser.userId, type: "match", title, body, referenceId: match.id });
      }
      if (umkmProfile) {
        await createNotification({ userId: umkmProfile.userId, type: "match", title, body, referenceId: match.id });
      }
    } catch (_err) { /* non-blocking */ }

    return res.json(updated);
  }

  // ─── NON-ADMIN: must be pending ───────────────────────────
  if (match.status !== "pending") throw new AppError("Match already responded", 400);

  // ─── STUDENT RESPONSE ────────────────────────────────────
  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);

  if (req.user.role === "student" && studentProfile?.id === match.studentId) {
    const updateData = { studentResponse: response, respondedAt: new Date() };

    if (response === "rejected") {
      updateData.status = "rejected";
    }

    await db.update(matchmaking).set(updateData).where(eq(matchmaking.id, match.id));

    // Re-read after update to avoid race condition
    const [freshMatch] = await db.select().from(matchmaking).where(eq(matchmaking.id, match.id)).limit(1);
    if (response === "accepted" && freshMatch?.umkmResponse === "accepted") {
      await db.update(matchmaking).set({ status: "accepted", matchedAt: new Date() }).where(eq(matchmaking.id, match.id));
      await createInternshipFromMatch(match);
    }
  } else {
    // ─── UMKM RESPONSE ──────────────────────────────────────
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

    // Re-read after update to avoid race condition
    const [freshMatch] = await db.select().from(matchmaking).where(eq(matchmaking.id, match.id)).limit(1);
    if (response === "accepted" && freshMatch?.studentResponse === "accepted") {
      await db.update(matchmaking).set({ status: "accepted", matchedAt: new Date() }).where(eq(matchmaking.id, match.id));
      await createInternshipFromMatch(match);
    }
  }

  const [updated] = await db.select().from(matchmaking).where(eq(matchmaking.id, match.id)).limit(1);

  // Notify other party about response
  try {
    if (response === "accepted" || response === "rejected") {
      const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, match.needId)).limit(1);
      const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.id, need?.umkmId)).limit(1);
      const [studentUser] = await db.select({ userId: users.id }).from(users).leftJoin(students, eq(users.id, students.userId)).where(eq(students.id, match.studentId)).limit(1);

      const otherUserId = req.user.role === "student" ? umkmProfile?.userId : studentUser?.userId;
      const actorName = req.user.role === "student" ? "Siswa" : "UMKM";

      if (otherUserId) {
        await createNotification({
          userId: otherUserId,
          type: "match",
          title: `Lamaran ${response === "accepted" ? "Diterima" : "Ditolak"}`,
          body: `${actorName} telah ${response === "accepted" ? "menerima" : "menolak"} lamaran magang.`,
          referenceId: match.id,
        });
      }
    }
  } catch (_err) { /* non-blocking */ }

  res.json(updated);
});

async function createInternshipFromMatch(match) {
  const [need] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, match.needId)).limit(1);
  if (!need) return;

  const startDate = need.startDate || new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (need.durationDays || 14));

  // Overlap detection: check if student has any active/scheduled internship in same period
  const overlapping = await db
    .select()
    .from(internships)
    .where(
      and(
        eq(internships.studentId, match.studentId),
        or(
          eq(internships.status, "active"),
          eq(internships.status, "scheduled"),
        ),
        and(
          lte(internships.startDate, endDate),
          gte(internships.endDate, startDate),
        ),
      ),
    )
    .limit(1);

  if (overlapping.length > 0) {
    console.warn(`Overlap detected: student ${match.studentId} already has internship in this period`);
    return { error: "overlap", message: "Siswa sudah memiliki magang di periode yang sama" };
  }

  // UMKM max active check
  const activeCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(internships)
    .where(
      and(
        eq(internships.umkmId, need.umkmId),
        or(
          eq(internships.status, "active"),
          eq(internships.status, "scheduled"),
        ),
      ),
    );

  const count = Number(activeCount[0]?.count || 0);
  if (count >= 5) {
    console.warn(`UMKM ${need.umkmId} already has 5 active/scheduled internships`);
    return { error: "max_capacity", message: "UMKM sudah mencapai batas magang aktif" };
  }

  await db.insert(internships).values({
    id: generateId(),
    matchId: match.id,
    studentId: match.studentId,
    umkmId: need.umkmId,
    startDate,
    endDate,
    status: "scheduled",
  });

  // Notification to student
  try {
    const [studentUser] = await db
      .select({ userId: users.id })
      .from(users)
      .innerJoin(students, eq(users.id, students.userId))
      .where(eq(students.id, match.studentId))
      .limit(1);

    if (studentUser) {
      const [umkmUser] = await db
        .select({ userId: users.id, businessName: umkm.businessName })
        .from(users)
        .innerJoin(umkm, eq(users.id, umkm.userId))
        .where(eq(umkm.id, need.umkmId))
        .limit(1);

      await createNotification({
        userId: studentUser.userId,
        type: "schedule",
        title: "Magang Terjadwal",
        body: `Magang Anda di ${umkmUser?.businessName || "perusahaan"} telah dijadwalkan mulai ${startDate.toISOString().split("T")[0]}`,
        referenceId: match.id,
      });

      if (umkmUser) {
        await createNotification({
          userId: umkmUser.userId,
          type: "schedule",
          title: "Ada Peserta Magang Baru",
          body: `Seorang peserta telah terjadwal magang di perusahaan Anda mulai ${startDate.toISOString().split("T")[0]}`,
          referenceId: match.id,
        });
      }
    }
  } catch (_err) { /* non-blocking */ }

  await db
    .update(internshipNeeds)
    .set({ slotFilled: sql`COALESCE(${internshipNeeds.slotFilled}, 0) + 1` })
    .where(eq(internshipNeeds.id, need.id));

  const [updatedNeed] = await db.select().from(internshipNeeds).where(eq(internshipNeeds.id, need.id)).limit(1);
  if (updatedNeed && updatedNeed.slotFilled >= updatedNeed.slotCount) {
    await db.update(internshipNeeds).set({ status: "filled" }).where(eq(internshipNeeds.id, need.id));
  }
}

export const studentApplyToNeed = asyncHandler(async (req, res) => {
  const needId = req.params.needId;

  const [studentProfile] = await db.select().from(students).where(eq(students.userId, req.user.userId)).limit(1);
  if (!studentProfile) throw new AppError("Student profile not found", 404);

  // Check cooling-off period
  if (studentProfile.coolingOffUntil && new Date(studentProfile.coolingOffUntil) > new Date()) {
    const until = new Date(studentProfile.coolingOffUntil).toLocaleDateString("id-ID");
    throw new AppError(`Anda dalam periode pendinginan hingga ${until}. Tidak dapat melamar magang baru.`, 403);
  }

  const [need] = await db
    .select({
      id: internshipNeeds.id,
      title: internshipNeeds.title,
      status: internshipNeeds.status,
      requiredSkills: internshipNeeds.requiredSkills,
      requiredMajor: internshipNeeds.requiredMajor,
      slotCount: internshipNeeds.slotCount,
      slotFilled: internshipNeeds.slotFilled,
      durationDays: internshipNeeds.durationDays,
      compensation: internshipNeeds.compensation,
      umkmId: internshipNeeds.umkmId,
      startDate: internshipNeeds.startDate,
    })
    .from(internshipNeeds)
    .where(eq(internshipNeeds.id, needId))
    .limit(1);

  if (!need) throw new AppError("Internship need not found", 404);
  if (need.status !== "open") throw new AppError("This internship is no longer open", 400);

  const [existing] = await db
    .select()
    .from(matchmaking)
    .where(and(eq(matchmaking.studentId, studentProfile.id), eq(matchmaking.needId, needId)))
    .limit(1);

  if (existing) throw new AppError("You have already applied to this need", 400);

  // Get UMKM data for location matching
  const [umkmProfile] = await db.select().from(umkm).where(eq(umkm.id, need.umkmId)).limit(1);

  // Get latest test results for test performance scoring
  const [latestResult] = await db
    .select()
    .from(skillTestResults)
    .where(eq(skillTestResults.studentId, studentProfile.id))
    .orderBy(desc(skillTestResults.createdAt))
    .limit(1);

  const studentSkills = Array.isArray(studentProfile.skills)
    ? studentProfile.skills
    : (typeof studentProfile.skills === "string" ? JSON.parse(studentProfile.skills) : []);

  const requiredSkills = Array.isArray(need.requiredSkills)
    ? need.requiredSkills
    : (typeof need.requiredSkills === "string" ? JSON.parse(need.requiredSkills) : []);

  const { matchScore, matchDetails } = computeMatchScore({
    studentSkills,
    requiredSkills,
    studentMajor: studentProfile.major,
    requiredMajor: need.requiredMajor,
    studentCity: studentProfile.city,
    umkmCity: umkmProfile?.city,
    skillBreakdown: latestResult?.skillBreakdown || null,
    recommendedRoles: latestResult?.recommendedRoles || null,
    needTitle: need.title,
    overallScore: latestResult?.overallScore || null,
  });

  const id = generateId();

  await db.insert(matchmaking).values({
    id,
    studentId: studentProfile.id,
    needId,
    matchScore,
    matchDetails,
    source: "student_apply",
    status: "pending",
    studentResponse: "accepted",
  });

  const [created] = await db.select().from(matchmaking).where(eq(matchmaking.id, id)).limit(1);
  res.status(201).json(created);
});

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
    source: "admin",
  });

  const [created] = await db.select().from(matchmaking).where(eq(matchmaking.id, id)).limit(1);
  res.status(201).json(created);
});

// ─── AUTO MATCH FROM TEST RESULTS ─────────────────────────

const MAX_PENDING_MATCHES = 10;
const MATCH_EXPIRY_DAYS = 30;

export async function autoMatchFromTestResults(studentId, skillBreakdown, recommendedRoles) {
  const [studentProfile] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!studentProfile) return [];

  // Check cooling-off period
  if (studentProfile.coolingOffUntil && new Date(studentProfile.coolingOffUntil) > new Date()) {
    return [];
  }

  // Check pending match limit
  const [pendingCount] = await db
    .select({ count: sql`COUNT(*)` })
    .from(matchmaking)
    .where(
      and(
        eq(matchmaking.studentId, studentId),
        eq(matchmaking.status, "pending"),
      ),
    );
  if (Number(pendingCount?.count || 0) >= MAX_PENDING_MATCHES) {
    return [];
  }

  // Expire old pending matches
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - MATCH_EXPIRY_DAYS);
  await db
    .update(matchmaking)
    .set({ status: "expired" })
    .where(
      and(
        eq(matchmaking.status, "pending"),
        lte(matchmaking.createdAt, expiryDate),
      ),
    );

  // Fetch open needs with UMKM location data
  const openNeeds = await db
    .select({
      id: internshipNeeds.id,
      umkmId: internshipNeeds.umkmId,
      title: internshipNeeds.title,
      requiredSkills: internshipNeeds.requiredSkills,
      requiredMajor: internshipNeeds.requiredMajor,
      slotCount: internshipNeeds.slotCount,
      slotFilled: internshipNeeds.slotFilled,
      durationDays: internshipNeeds.durationDays,
      startDate: internshipNeeds.startDate,
      compensation: internshipNeeds.compensation,
      umkmCity: umkm.city,
    })
    .from(internshipNeeds)
    .leftJoin(umkm, eq(internshipNeeds.umkmId, umkm.id))
    .where(eq(internshipNeeds.status, "open"));

  if (openNeeds.length === 0) return [];

  const studentSkills = Array.isArray(studentProfile.skills)
    ? studentProfile.skills
    : (typeof studentProfile.skills === "string" ? JSON.parse(studentProfile.skills) : []);

  const candidateMatches = [];

  for (const need of openNeeds) {
    const requiredSkills = Array.isArray(need.requiredSkills)
      ? need.requiredSkills
      : (typeof need.requiredSkills === "string" ? JSON.parse(need.requiredSkills) : []);

    const { matchScore, matchDetails } = computeMatchScore({
      studentSkills,
      requiredSkills,
      studentMajor: studentProfile.major,
      requiredMajor: need.requiredMajor,
      studentCity: studentProfile.city,
      umkmCity: need.umkmCity,
      skillBreakdown,
      recommendedRoles,
      needTitle: need.title,
      overallScore: null,
    });

    if (matchScore >= 50) {
      candidateMatches.push({
        needId: need.id,
        matchScore,
        matchDetails,
        needTitle: need.title,
      });
    }
  }

  candidateMatches.sort((a, b) => b.matchScore - a.matchScore);
  const topMatches = candidateMatches.slice(0, 3);

  const createdMatches = [];

  for (const m of topMatches) {
    // Dedup: skip if same pair exists (any status)
    const [existing] = await db
      .select()
      .from(matchmaking)
      .where(
        and(
          eq(matchmaking.studentId, studentId),
          eq(matchmaking.needId, m.needId),
        ),
      )
      .limit(1);

    if (existing) continue;

    // Re-check limit after expiry cleanup
    const [currentCount] = await db
      .select({ count: sql`COUNT(*)` })
      .from(matchmaking)
      .where(
        and(
          eq(matchmaking.studentId, studentId),
          eq(matchmaking.status, "pending"),
        ),
      );
    if (Number(currentCount?.count || 0) >= MAX_PENDING_MATCHES) break;

    const id = generateId();

    await db.insert(matchmaking).values({
      id,
      studentId,
      needId: m.needId,
      matchScore: m.matchScore,
      matchDetails: m.matchDetails,
      source: "auto",
      status: "pending",
      studentResponse: "pending",
      umkmResponse: "pending",
    });

    // Notify student
    try {
      await createNotification({
        userId: studentProfile.userId,
        type: "match",
        title: "Rekomendasi Magang Baru",
        body: `Kami menemukan ${m.needTitle} yang cocok dengan skill Anda (skor: ${m.matchScore})`,
        referenceId: id,
      });
    } catch (_err) { /* non-blocking */ }

    // Notify UMKM
    try {
      const [needRecord] = await db
        .select()
        .from(internshipNeeds)
        .where(eq(internshipNeeds.id, m.needId))
        .limit(1);

      if (needRecord) {
        const [umkmRecord] = await db
          .select()
          .from(umkm)
          .where(eq(umkm.id, needRecord.umkmId))
          .limit(1);

        if (umkmRecord) {
          await createNotification({
            userId: umkmRecord.userId,
            type: "match",
            title: "Ada Kandidat Baru",
            body: `Siswa baru direkomendasikan untuk ${m.needTitle} (skor: ${m.matchScore})`,
            referenceId: id,
          });
        }
      }
    } catch (_err) { /* non-blocking */ }

    createdMatches.push({ id, needId: m.needId, matchScore: m.matchScore });
  }

  return createdMatches;
}

// ─── MANUAL TRIGGER AUTO-MATCH ────────────────────────────

export const triggerAutoMatch = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) throw new AppError("studentId is required", 400);

  const [latestResult] = await db
    .select()
    .from(skillTestResults)
    .where(eq(skillTestResults.studentId, studentId))
    .orderBy(desc(skillTestResults.createdAt))
    .limit(1);

  if (!latestResult) throw new AppError("No skill test results found for this student", 404);

  const matches = await autoMatchFromTestResults(
    studentId,
    latestResult.skillBreakdown,
    latestResult.recommendedRoles,
  );

  res.status(201).json({ message: "Auto-match completed", matches });
});
