import "dotenv/config"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { db } from "./config/database.js"
import { users } from "./db/schema/users.js"
import { students } from "./db/schema/students.js"
import { umkm } from "./db/schema/umkm.js"
import { admins } from "./db/schema/admins.js"
import { internshipNeeds } from "./db/schema/internshipNeeds.js"
import { matchmaking } from "./db/schema/matchmaking.js"
import { internships } from "./db/schema/internships.js"
import { skillTestQuestions } from "./db/schema/skillTestQuestions.js"
import { skillTestAttempts } from "./db/schema/skillTestAttempts.js"
import { skillTestAnswers } from "./db/schema/skillTestAnswers.js"
import { skillTestResults } from "./db/schema/skillTestResults.js"
import { evaluations } from "./db/schema/evaluations.js"
import { certificates } from "./db/schema/certificates.js"
import { notifications } from "./db/schema/notifications.js"
import { supportTickets } from "./db/schema/supportTickets.js"

function id() {
  return crypto.randomUUID()
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ─── DATA DEFINITIONS ─────────────────────────────────────

const STUDENTS_DATA = [
  { fullName: "Ahmad Rizaldi", email: "ahmad@student.id", phone: "081200000001", school: "SMK N 1 Jakarta", major: "Rekayasa Perangkat Lunak", city: "Jakarta", nisn: "1234567890", skills: ["JavaScript", "PHP", "Laravel", "MySQL"] },
  { fullName: "Siti Nurhaliza", email: "siti@student.id", phone: "081200000002", school: "SMK N 2 Bandung", major: "Multimedia", city: "Bandung", nisn: "1234567891", skills: ["Photoshop", "Illustrator", "Premiere Pro", "UI Design"] },
  { fullName: "Budi Santoso", email: "budi@student.id", phone: "081200000003", school: "SMK N 3 Surabaya", major: "Akuntansi", city: "Surabaya", nisn: "1234567892", skills: ["Excel", "MYOB", "SAP Basic", "Tax Reporting"] },
  { fullName: "Dewi Lestari", email: "dewi@student.id", phone: "081200000004", school: "SMK N 1 Yogyakarta", major: "Tata Boga", city: "Yogyakarta", nisn: "1234567893", skills: ["Pastry", "Culinary", "Food Safety", "Menu Planning"] },
  { fullName: "Rizky Pratama", email: "rizky@student.id", phone: "081200000005", school: "SMK N 4 Semarang", major: "Teknik Komputer dan Jaringan", city: "Semarang", nisn: "1234567894", skills: ["Cisco", "Mikrotik", "Network Security", "Linux"] },
]

const UMKM_DATA = [
  { fullName: "Hendra Gunawan", email: "hendra@umkm.id", phone: "081300000001", businessName: "Warung Digital Nusantara", businessType: "Teknologi Informasi", city: "Jakarta", description: "Startup pengembangan web dan aplikasi mobile untuk UMKM lokal." },
  { fullName: "Rina Marlina", email: "rina@umkm.id", phone: "081300000002", businessName: "Kreatif Studio Visual", businessType: "Desain Grafis", city: "Bandung", description: "Studio desain grafis dan produksi konten digital untuk brand lokal." },
  { fullName: "Agus Wijaya", email: "agus@umkm.id", phone: "081300000003", businessName: "Berkah Bakery & Catering", businessType: "Kuliner", city: "Yogyakarta", description: "Usaha bakery dan catering untuk acara, melayani pesanan harian." },
]

const QUESTIONS_DATA = [
  { category: "Pemrograman", difficulty: "beginner", questionType: "multiple_choice", questionText: "Apa fungsi dari tag `<h1>` pada HTML?", options: [{ label: "A", text: "Membuat heading terbesar" }, { label: "B", text: "Membuat hyperlink" }, { label: "C", text: "Membuat tabel" }, { label: "D", text: "Membuat paragraf" }], correctAnswer: "A", pointValue: 10 },
  { category: "Pemrograman", difficulty: "beginner", questionType: "multiple_choice", questionText: "Manakah tipe data yang benar di JavaScript?", options: [{ label: "A", text: "string" }, { label: "B", text: "text" }, { label: "C", text: "char" }, { label: "D", text: "varchar" }], correctAnswer: "A", pointValue: 10 },
  { category: "Pemrograman", difficulty: "intermediate", questionType: "multiple_choice", questionText: "Apa output dari `console.log(typeof [])` di JavaScript?", options: [{ label: "A", text: "array" }, { label: "B", text: "object" }, { label: "C", text: "undefined" }, { label: "D", text: "null" }], correctAnswer: "B", pointValue: 10 },
  { category: "Pemrograman", difficulty: "intermediate", questionType: "essay", questionText: "Jelaskan perbedaan antara `var`, `let`, dan `const` di JavaScript!", pointValue: 15 },
  { category: "Desain", difficulty: "beginner", questionType: "multiple_choice", questionText: "Apa kepanjangan dari RGB dalam desain grafis?", options: [{ label: "A", text: "Red Green Blue" }, { label: "B", text: "Random Graphics Board" }, { label: "C", text: "Raster Grid Binary" }, { label: "D", text: "Red Gold Black" }], correctAnswer: "A", pointValue: 10 },
  { category: "Desain", difficulty: "intermediate", questionType: "multiple_choice", questionText: "Software mana yang umum digunakan untuk desain vektor?", options: [{ label: "A", text: "Adobe Photoshop" }, { label: "B", text: "Adobe Illustrator" }, { label: "C", text: "Adobe Premiere" }, { label: "D", text: "Adobe After Effects" }], correctAnswer: "B", pointValue: 10 },
  { category: "Akuntansi", difficulty: "beginner", questionType: "multiple_choice", questionText: "Apa persamaan dasar akuntansi?", options: [{ label: "A", text: "Aset = Liabilitas + Ekuitas" }, { label: "B", text: "Aset = Pendapatan - Beban" }, { label: "C", text: "Aset = Kas + Piutang" }, { label: "D", text: "Aset = Modal - Utang" }], correctAnswer: "A", pointValue: 10 },
  { category: "Akuntansi", difficulty: "intermediate", questionType: "essay", questionText: "Jelaskan perbedaan antara jurnal umum dan buku besar!", pointValue: 15 },
  { category: "Jaringan", difficulty: "beginner", questionType: "multiple_choice", questionText: "Apa kepanjangan dari IP?", options: [{ label: "A", text: "Internet Protocol" }, { label: "B", text: "Internal Program" }, { label: "C", text: "Integrated Platform" }, { label: "D", text: "Information Provider" }], correctAnswer: "A", pointValue: 10 },
  { category: "Jaringan", difficulty: "intermediate", questionType: "multiple_choice", questionText: "Apa fungsi dari router dalam jaringan?", options: [{ label: "A", text: "Menghubungkan dua jaringan berbeda" }, { label: "B", text: "Memperkuat sinyal WiFi" }, { label: "C", text: "Menyimpan data website" }, { label: "D", text: "Mencetak dokumen" }], correctAnswer: "A", pointValue: 10 },
  { category: "Tata Boga", difficulty: "beginner", questionType: "multiple_choice", questionText: "Apa bahan utama pembuatan mayonnaise?", options: [{ label: "A", text: "Telur dan minyak" }, { label: "B", text: "Susu dan gula" }, { label: "C", text: "Tepung dan mentega" }, { label: "D", text: "Coklat dan krim" }], correctAnswer: "A", pointValue: 10 },
  { category: "Pemrograman", difficulty: "advanced", questionType: "coding", questionText: "Buat function untuk mengecek apakah sebuah string adalah palindrome.", pointValue: 20 },
]

const NEEDS_DATA = [
  { title: "Asisten Developer Web", description: "Membantu pengembangan website company profile dan toko online menggunakan Laravel & Vue.js.", requiredSkills: ["Laravel", "Vue.js", "MySQL", "Bootstrap"], requiredMajor: "Rekayasa Perangkat Lunak", slotCount: 2, durationDays: 14, compensation: "Rp 500.000" },
  { title: "Desainer Grafis Junior", description: "Membuat konten visual untuk media sosial dan katalog produk UMKM.", requiredSkills: ["Photoshop", "Illustrator", "Canva"], requiredMajor: "Multimedia", slotCount: 1, durationDays: 14, compensation: "Rp 400.000" },
  { title: "Asisten Administrasi Keuangan", description: "Membantu pencatatan transaksi harian dan rekonsiliasi bank.", requiredSkills: ["Excel", "Akuntansi Dasar", "MYOB"], requiredMajor: "Akuntansi", slotCount: 1, durationDays: 14, compensation: "Rp 350.000" },
  { title: "Koki Pastry Magang", description: "Membantu produksi kue dan roti harian di dapur bakery.", requiredSkills: ["Pastry", "Baking", "Food Safety"], requiredMajor: "Tata Boga", slotCount: 2, durationDays: 14, compensation: "Rp 400.000 + Makan" },
  { title: "Teknisi Jaringan Magang", description: "Membantu instalasi dan konfigurasi jaringan kantor klien.", requiredSkills: ["Mikrotik", "Cabling", "Network Config"], requiredMajor: "Teknik Komputer dan Jaringan", slotCount: 1, durationDays: 14, compensation: "Rp 450.000" },
]

async function seed() {
  console.log("=== SEED DATABASE SKILL BRIDGE ===\n")

  // ─── 1. ADMIN ─────────────────────────────────────────────
  console.log("1. Membuat admin...")
  const hash = await bcrypt.hash("admin123", 12)

  const adminUserId = id()
  const adminProfileId = id()
  await db.insert(users).values({ id: adminUserId, email: "admin@skillbridge.id", phone: "081111111111", passwordHash: hash, fullName: "Super Admin", role: "admin", isVerified: true })
  await db.insert(admins).values({ id: adminProfileId, userId: adminUserId, roleLevel: "superadmin", permissions: JSON.parse(JSON.stringify(["user:read","user:write","user:delete","student:read","umkm:read","umkm:verify","internship:read","match:read","match:override","question:read","question:write","notification:send","statistics:read","system:config"])) })

  const modUserId = id()
  await db.insert(users).values({ id: modUserId, email: "moderator@skillbridge.id", phone: "081111111112", passwordHash: hash, fullName: "Moderator Satu", role: "admin", isVerified: true })
  await db.insert(admins).values({ id: id(), userId: modUserId, roleLevel: "moderator", permissions: JSON.parse(JSON.stringify(["user:read","student:read","umkm:read","umkm:verify","internship:read","match:read","question:read","statistics:read"])) })

  console.log("   admin@skillbridge.id / admin123 (superadmin)")
  console.log("   moderator@skillbridge.id / admin123 (moderator)")

  // ─── 2. STUDENTS ──────────────────────────────────────────
  console.log("\n2. Membuat siswa...")
  const studentPass = await bcrypt.hash("siswa123", 12)
  const studentIds = []
  const studentProfileIds = []

  for (const s of STUDENTS_DATA) {
    const uid = id()
    await db.insert(users).values({ id: uid, email: s.email, phone: s.phone, passwordHash: studentPass, fullName: s.fullName, role: "student", isVerified: true })
    studentIds.push(uid)

    const pid = id()
    await db.insert(students).values({ id: pid, userId: uid, nisn: s.nisn, school: s.school, major: s.major, city: s.city, skills: JSON.parse(JSON.stringify(s.skills)), graduationYear: 2025 })
    studentProfileIds.push(pid)
  }

  STUDENTS_DATA.forEach((s, i) => console.log(`   ${s.email} / siswa123 — ${s.fullName} (${s.school})`))

  // ─── 3. UMKM ──────────────────────────────────────────────
  console.log("\n3. Membuat UMKM...")
  const umkmPass = await bcrypt.hash("umkm123", 12)
  const umkmUserIds = []
  const umkmProfileIds = []

  for (let i = 0; i < UMKM_DATA.length; i++) {
    const u = UMKM_DATA[i]
    const uid = id()
    await db.insert(users).values({ id: uid, email: u.email, phone: u.phone, passwordHash: umkmPass, fullName: u.fullName, role: "umkm", isVerified: true })
    umkmUserIds.push(uid)

    const pid = id()
    await db.insert(umkm).values({ id: pid, userId: uid, businessName: u.businessName, businessType: u.businessType, city: u.city, description: u.description, nib: String(912345678901234 + i), isVerified: true, verifiedAt: new Date(), verifiedBy: adminProfileId })
    umkmProfileIds.push(pid)
  }

  UMKM_DATA.forEach((u, i) => console.log(`   ${u.email} / umkm123 — ${u.businessName}`))

  // ─── 4. SKILL TEST QUESTIONS ─────────────────────────────
  console.log("\n4. Membuat soal skill test...")
  const questionIds = []
  for (const q of QUESTIONS_DATA) {
    const qid = id()
    const vals = { id: qid, category: q.category, difficulty: q.difficulty, questionText: q.questionText, questionType: q.questionType, pointValue: q.pointValue || 10, isActive: true }
    if (q.options) vals.options = JSON.parse(JSON.stringify(q.options))
    if (q.correctAnswer) vals.correctAnswer = q.correctAnswer
    await db.insert(skillTestQuestions).values(vals)
    questionIds.push(qid)
  }
  console.log(`   ${QUESTIONS_DATA.length} soal dibuat`)

  // ─── 5. INTERNSHIP NEEDS (UMKM) ──────────────────────────
  console.log("\n5. Membuat kebutuhan magang...")
  const needIds = []
  for (let i = 0; i < NEEDS_DATA.length; i++) {
    const nid = id()
    const umkmIdx = i < 2 ? 0 : i < 4 ? 1 : 2
    await db.insert(internshipNeeds).values({
      id: nid, umkmId: umkmProfileIds[umkmIdx], title: NEEDS_DATA[i].title,
      description: NEEDS_DATA[i].description, requiredSkills: JSON.parse(JSON.stringify(NEEDS_DATA[i].requiredSkills)),
      requiredMajor: NEEDS_DATA[i].requiredMajor, slotCount: NEEDS_DATA[i].slotCount, slotFilled: i < 1 ? 1 : 0,
      durationDays: NEEDS_DATA[i].durationDays, compensation: NEEDS_DATA[i].compensation, status: i < 2 ? "open" : "open",
      startDate: daysFromNow(3),
    })
    needIds.push(nid)
  }
  console.log(`   ${NEEDS_DATA.length} kebutuhan dibuat`)

  // ─── 6. MATCHMAKING ──────────────────────────────────────
  console.log("\n6. Membuat matchmaking...")
  // Match 1: student-0 (Ahmad) applies to need-0 (Asisten Developer Web, Warung Digital)
  const match1Id = id()
  await db.insert(matchmaking).values({ id: match1Id, studentId: studentProfileIds[0], needId: needIds[0], status: "accepted", studentResponse: "accepted", umkmResponse: "accepted", matchScore: 85, matchedAt: new Date() })
  // Match 2: student-1 (Siti) applies to need-1 (Desainer Grafis Junior, Kreatif Studio)
  const match2Id = id()
  await db.insert(matchmaking).values({ id: match2Id, studentId: studentProfileIds[1], needId: needIds[1], status: "pending", studentResponse: "accepted", umkmResponse: "pending", matchScore: 72 })
  // Match 3: student-2 (Budi) applies to need-2 (Asisten Admin Keuangan, Berkah Bakery)
  const match3Id = id()
  await db.insert(matchmaking).values({ id: match3Id, studentId: studentProfileIds[2], needId: needIds[2], status: "pending", studentResponse: "accepted", umkmResponse: "pending", matchScore: 68 })

  console.log(`   3 match dibuat (1 accepted, 2 pending)`)

  // ─── 7. INTERNSHIPS (from match 1) ───────────────────────
  console.log("\n7. Membuat internship...")
  const internship1Id = id()
  await db.insert(internships).values({
    id: internship1Id, matchId: match1Id, studentId: studentProfileIds[0], umkmId: umkmProfileIds[0],
    startDate: daysFromNow(-7), endDate: daysFromNow(7), status: "active",
    dailyLog: JSON.parse(JSON.stringify([
      { id: "log001", date: daysFromNow(-7).toISOString().split("T")[0], content: "Hari pertama: onboarding dan pengenalan project.", createdAt: daysFromNow(-7) },
      { id: "log002", date: daysFromNow(-6).toISOString().split("T")[0], content: "Belajar struktur Laravel dan setup database.", createdAt: daysFromNow(-6) },
      { id: "log003", date: daysFromNow(-5).toISOString().split("T")[0], content: "Membuat halaman landing page company profile.", createdAt: daysFromNow(-5) },
      { id: "log004", date: daysFromNow(-4).toISOString().split("T")[0], content: "Integrasi Vue.js dengan API backend.", createdAt: daysFromNow(-4) },
      { id: "log005", date: daysFromNow(-3).toISOString().split("T")[0], content: "Testing dan debugging fitur login.", createdAt: daysFromNow(-3) },
    ])),
  })
  console.log(`   1 internship aktif (Ahmad → Warung Digital)`)

  // ─── 8. SKILL TEST ATTEMPTS + RESULTS ───────────────────
  console.log("\n8. Membuat skill test attempts...")
  for (let i = 0; i < 3; i++) {
    const attId = id()
    await db.insert(skillTestAttempts).values({ id: attId, studentId: studentProfileIds[i], startedAt: daysFromNow(-2), completedAt: daysFromNow(-2), status: "completed", totalScore: [85, 78, 65][i] })
    await db.insert(skillTestResults).values({
      id: id(), studentId: studentProfileIds[i], attemptId: attId,
      overallScore: [85, 78, 65][i],
      skillBreakdown: JSON.parse(JSON.stringify({ programming: 80, logic: 90, design: i === 1 ? 85 : 70 })),
      recommendedRoles: JSON.parse(JSON.stringify([["Junior Developer"],["Junior Designer"],["Admin Staff"]][i])),
    })

    // Add answers for each attempt (answer first 3 MCQ questions correctly)
    for (let j = 0; j < 3; j++) {
      const q = QUESTIONS_DATA[j]
      if (q.questionType === "multiple_choice") {
        await db.insert(skillTestAnswers).values({
          id: id(), attemptId: attId, questionId: questionIds[j],
          answerText: q.correctAnswer, isCorrect: true, scoreObtained: q.pointValue || 10, answeredAt: daysFromNow(-2),
        })
      }
    }
  }
  console.log(`   3 attempt + result (skor: 85, 78, 65)`)

  // ─── 9. EVALUATIONS + CERTIFICATES ───────────────────────
  console.log("\n9. Membuat evaluasi & sertifikat (contoh completed)...")
  // Create a second internship that is "completed" for demo
  const completedInternshipId = id()
  const completedMatchId = id()
  await db.insert(matchmaking).values({ id: completedMatchId, studentId: studentProfileIds[3], needId: needIds[3], status: "accepted", studentResponse: "accepted", umkmResponse: "accepted", matchScore: 80, matchedAt: daysFromNow(-21) })
  await db.insert(internships).values({
    id: completedInternshipId, matchId: completedMatchId, studentId: studentProfileIds[3], umkmId: umkmProfileIds[1],
    startDate: daysFromNow(-21), endDate: daysFromNow(-7), status: "completed", completedAt: daysFromNow(-7),
    dailyLog: JSON.parse(JSON.stringify([
      { id: "log101", date: daysFromNow(-21).toISOString().split("T")[0], content: "Orientasi dapur dan pengenalan menu.", createdAt: daysFromNow(-21) },
      { id: "log102", date: daysFromNow(-14).toISOString().split("T")[0], content: "Belajar teknik pastry dasar.", createdAt: daysFromNow(-14) },
    ])),
  })
  await db.insert(evaluations).values({ id: id(), internshipId: completedInternshipId, evaluatorRole: "student", rating: 5, reviewText: "Pengalaman magang yang sangat menyenangkan! Dapat ilmu baru tentang pastry.", createdAt: daysFromNow(-6) })
  await db.insert(evaluations).values({ id: id(), internshipId: completedInternshipId, evaluatorRole: "umkm", rating: 4, reviewText: "Siswa rajin dan cepat belajar. Terima kasih sudah membantu!", createdAt: daysFromNow(-6) })
  await db.insert(certificates).values({
    id: id(), studentId: studentProfileIds[3], internshipId: completedInternshipId,
    certificateNumber: `SB-${new Date().getFullYear()}-${String(10001).padStart(5, "0")}`,
    metadata: JSON.parse(JSON.stringify({ duration: "14 days", issuedVia: "auto" })), issuedAt: daysFromNow(-7),
  })
  console.log(`   1 internship selesai + evaluasi + sertifikat`)

  // ─── 10. NOTIFICATIONS ────────────────────────────────────
  console.log("\n10. Membuat notifikasi...")
  await db.insert(notifications).values({ id: id(), userId: studentIds[0], type: "match", title: "Match Diterima!", body: "Lamaran Anda untuk Asisten Developer Web diterima. Magang dimulai 7 hari lalu.", channel: "in_app", createdAt: daysFromNow(-7) })
  await db.insert(notifications).values({ id: id(), userId: umkmUserIds[0], type: "match", title: "Ada Pelamar Baru", body: "Siswa baru mendaftar ke kebutuhan Asisten Developer Web.", channel: "in_app", createdAt: daysFromNow(-2) })
  await db.insert(notifications).values({ id: id(), userId: studentIds[3], type: "certificate", title: "Sertifikat Terbit!", body: "Sertifikat kompetensi Anda sudah diterbitkan.", channel: "in_app", createdAt: daysFromNow(-7) })
  await db.insert(notifications).values({ id: id(), userId: studentIds[1], type: "match", title: "Lamaran Terkirim", body: "Anda mendaftar ke Desainer Grafis Junior di Kreatif Studio Visual.", channel: "in_app", createdAt: daysFromNow(-1) })
  console.log("   4 notifikasi")

  // ─── 11. SUPPORT TICKETS ──────────────────────────────────
  console.log("\n11. Membuat tiket support...")
  await db.insert(supportTickets).values({ id: id(), userId: studentIds[2], subject: "Cara mengulang skill test", body: "Saya ingin mengulang skill test karena hasilnya kurang memuaskan. Bagaimana caranya?", status: "open", priority: "medium", createdBy: studentIds[2] })
  await db.insert(supportTickets).values({ id: id(), userId: umkmUserIds[0], subject: "Verifikasi UMKM", body: "Saya sudah upload dokumen tapi belum diverifikasi. Mohon bantuannya.", status: "open", priority: "high", createdBy: umkmUserIds[0] })
  await db.insert(supportTickets).values({ id: id(), userId: studentIds[0], subject: "Sertifikat tidak muncul", body: "Saya sudah selesai magang tapi sertifikat belum terbit.", status: "resolved", priority: "high", assignedTo: adminUserId, resolvedAt: daysFromNow(-1), createdBy: studentIds[0] })
  console.log("   3 tiket support")

  // ─── SUMMARY ──────────────────────────────────────────────
  console.log("\n=== SEED SELESAI ===")
  console.log("\n--- Akun Login ---")
  console.log("Admin:")
  console.log("   admin@skillbridge.id / admin123 (superadmin)")
  console.log("   moderator@skillbridge.id / admin123 (moderator)")
  console.log("Siswa:")
  STUDENTS_DATA.forEach(s => console.log(`   ${s.email} / siswa123`))
  console.log("UMKM:")
  UMKM_DATA.forEach(u => console.log(`   ${u.email} / umkm123`))
  console.log("\n--- Data Statistik ---")
  console.log(`   ${STUDENTS_DATA.length} siswa`)
  console.log(`   ${UMKM_DATA.length} UMKM (terverifikasi)`)
  console.log(`   ${QUESTIONS_DATA.length} soal skill test`)
  console.log(`   ${NEEDS_DATA.length} kebutuhan magang`)
  console.log("   3 match (1 accepted, 2 pending)")
  console.log("   2 internship (1 active, 1 completed + evaluation + certificate)")
  console.log("   3 attempt skill test")
  console.log("   4 notifikasi")
  console.log("   3 tiket support\n")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
