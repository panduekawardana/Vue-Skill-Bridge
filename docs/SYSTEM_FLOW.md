# Skill Bridge — System Flow & Integration Guide

> **Dokumen ini menjelaskan alur sistem secara end-to-end, integrasi antar role (Student, UMKM, Admin), dan mapping API untuk seluruh fitur yang telah diimplementasikan.**

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Role & Responsibility](#2-role--responsibility)
3. [Alur Berdasarkan Role](#3-alur-berdasarkan-role)
   - 3.1 Student Flow
   - 3.2 UMKM Flow
   - 3.3 Admin Flow (Superadmin / Moderator / Support)
4. [End-to-End Business Flow](#4-end-to-end-business-flow)
   - 4.1 Skill Test Lifecycle
   - 4.2 Matchmaking & Internship Lifecycle
   - 4.3 Support Ticket Flow
5. [API Integration Map](#5-api-integration-map)
6. [Frontend-Backend Integration](#6-frontend-backend-integration)
7. [State Machine](#7-state-machine)
8. [Database Relationship Map](#8-database-relationship-map)

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Vue 3 + Vite)                       │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │ AuthPage  │  │ Dashboard    │  │ SkillTest  │  │ AdminPanel   │ │
│  │ (login/   │  │ (student/    │  │ Page       │  │ (users/      │ │
│  │ register) │  │  umkm/admin) │  │            │  │  tickets/    │ │
│  └─────┬─────┘  └──────┬───────┘  └─────┬──────┘  │  questions)  │ │
│        │               │                │         └──────┬───────┘ │
│        └───────────────┴────────────────┴────────────────┘         │
│                              │                                      │
│                         🔐 JWT Token (Bearer)                       │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP (REST JSON)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                         │
│                                                                      │
│  ┌──────────┐    ┌──────────────────┐    ┌────────────────────────┐ │
│  │ CORS     │───▶│ authenticate      │───▶│ authorize(roles)      │ │
│  │ JSON     │    │ (JWT verify)      │    │ (role-based guard)    │ │
│  └──────────┘    └──────────────────┘    └───────────┬────────────┘ │
│                                                      │               │
│  ┌───────────────────────────────────────────────────┴───────────┐  │
│  │                      ROUTES (9 domain)                        │  │
│  │  /api/auth  /api/profiles  /api/internships  /api/skill-test  │  │
│  │  /api/matchmaking  /api/evaluations  /api/certificates        │  │
│  │  /api/notifications  /api/admin                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    CONTROLLERS (11 files)                      │  │
│  │  authController     profileController     internshipController │  │
│  │  skillTestController  matchmakingController  evaluationCtrl   │  │
│  │  certificateController  notificationController  adminController│  │
│  │  ticketController                                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  ORM: Drizzle (MySQL2)                         │  │
│  │  db.select().from(users).where(eq(users.id, userId))          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              DATABASE: MySQL (15 tables)                       │  │
│  │  users  students  umkm  admins  internship_needs  internships │  │
│  │  matchmaking  skill_test_*  evaluations  certificates          │  │
│  │  notifications  support_tickets                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Error Handler (centralized)                       │  │
│  │  AppError class → asyncHandler wrapper → errorHandler         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Layer Overview

| Layer | Teknologi | Fungsi |
|-------|-----------|--------|
| **Client** | Vue 3 + Composition API + Vite | SPA dengan routing, state management via Pinia (authStore), HTTP via custom `api.js` |
| **Middleware** | JWT + Express middleware | `authenticate` (verify token), `authorize` (role guard), `errorHandler` (centralized error) |
| **REST API** | Express Router | 9 domain route, diprefiks `/api`, async handler wrapping |
| **ORM** | Drizzle ORM (MySQL2) | Type-safe query builder, schema-driven, migration via `drizzle-kit` |
| **Database** | MySQL | 15 tabel dengan foreign keys, unique constraints, indexes |

---

## 2. Role & Responsibility

### 2.1 Definisi Role

| Role | Kode | Basis Pengguna | Deskripsi |
|------|------|----------------|-----------|
| **Siswa SMK** | `student` | `users.role = "student"` + `students` | Mencari pengalaman magang, mengikuti skill test, apply ke kebutuhan, mendapat sertifikat |
| **UMKM Lokal** | `umkm` | `users.role = "umkm"` + `umkm` | Pemberi magang, pasang kebutuhan, terima/tolak siswa, evaluasi |
| **Super Admin** | `admin` + `role_level = "superadmin"` | `admins` | Kelola penuh sistem: user, soal, match override, konfigurasi |
| **Moderator** | `admin` + `role_level = "moderator"` | `admins` | Verifikasi UMKM, kelola bank soal, moderasi konten |
| **Support** | `admin` + `role_level = "support"` | `admins` | Layanan bantuan via tiket, reset password, troubleshooting |

### 2.2 Hierarki Admin

```
                 ┌──────────────┐
                 │ Super Admin  │   Akses penuh semua fitur
                 └──────┬───────┘
                        │
            ┌───────────┴───────────┐
            │                       │
       ┌────┴─────┐          ┌─────┴──────┐
       │ Moderator │          │  Support   │
       └────┬──────┘          └─────┬──────┘
            │                       │
            └───────────┬───────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
     ┌────┴─────┐               ┌─────┴──────┐
     │  Student │               │    UMKM    │
     └──────────┘               └────────────┘
```

> Student dan UMKM sejajar — keduanya adalah pengguna akhir platform.

---

## 3. Alur Berdasarkan Role

### 3.1 Student Flow

```
                    ┌───────────────────┐
                    │   REGISTRASI      │
                    │  POST /auth/      │
                    │  register         │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │    LOGIN          │
                    │  POST /auth/login │
                    │  → Dapat JWT      │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────┐
                    │  LENGKAPI PROFIL   │
                    │  PUT /profiles/    │
                    │  students/:id      │
                    │  (school, major,   │
                    │   skills, bio)     │
                    └────────┬──────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
               ▼                           ▼
     ┌──────────────────┐      ┌─────────────────────┐
     │  SKILL TEST       │      │  LIHAT KEBUTUHAN    │
     │  POST /skill-test │      │  GET /internships/  │
     │  /attempts        │      │  needs              │
     │  → 20 soal acak   │      │  (filter by city,   │
     │  → 15 menit       │      │   major, status)    │
     └────────┬──────────┘      └──────────┬──────────┘
              │                            │
              ▼                            ▼
     ┌──────────────────┐      ┌─────────────────────┐
     │  SUBMIT JAWABAN  │      │  APPLY KE KEBUTUHAN │
     │  POST /skill-test│      │  POST /matchmaking/ │
     │  /attempts/:id/  │      │  apply/:needId       │
     │  submit           │      │  → match dibuat     │
     │  → auto-grade     │      │  (studentResponse = │
     │  → dapat skor     │      │   "accepted")       │
     └────────┬──────────┘      └──────────┬──────────┘
              │                            │
              └──────────┬─────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  LIHAT RECOMMENDASI  │
              │  GET /matchmaking    │
              │  → lihat match yg    │
              │   masuk (pending/    │
              │   accepted/rejected) │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  KONFIRMASI MATCH    │
              │  POST /matchmaking/  │
              │  :id/respond         │
              │  → accept/reject     │
              │  Jika kedua pihak    │
              │  accept → internship │
              │  otomatis dibuat     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  INTERNSHIP AKTIF    │
              │  GET /internships/   │
              │  list → lihat detail │
              │  POST .../daily-log  │
              │  (isi log harian)    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  EVALUASI            │
              │  POST /evaluations   │
              │  (rating 1-5 +       │
              │   review text)       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  SERTIFIKAT          │
              │  GET /certificates   │
              │  → unduh/lihat       │
              │   sertifikat digital │
              └──────────────────────┘
```

**Ringkasan Endpoint Student:**

| Urutan | Endpoint | Method | Deskripsi |
|--------|----------|--------|-----------|
| 1 | `/auth/register` | POST | Daftar akun (role: student) |
| 2 | `/auth/login` | POST | Login → JWT |
| 3 | `/profiles/students/:id` | PUT | Lengkapi profil |
| 4 | `/skill-test/attempts` | POST | Mulai skill test |
| 5 | `/skill-test/attempts/:id/submit` | POST | Submit jawaban |
| 6 | `/skill-test/results` | GET | Lihat hasil tes |
| 7 | `/internships/needs` | GET | Cari kebutuhan magang |
| 8 | `/matchmaking/apply/:needId` | POST | Apply ke kebutuhan |
| 9 | `/matchmaking` | GET | Lihat status match |
| 10 | `/matchmaking/:id/respond` | POST | Terima/tolak match |
| 11 | `/internships/list` | GET | Lihat internship aktif |
| 12 | `/internships/list/:id/daily-log` | POST | Isi log harian |
| 13 | `/evaluations` | POST | Evaluasi internship |
| 14 | `/certificates` | GET | Lihat sertifikat |

---

### 3.2 UMKM Flow

```
                    ┌───────────────────┐
                    │   REGISTRASI      │
                    │  POST /auth/      │
                    │  register         │
                    │  (role: umkm)     │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │  LENGKAPI PROFIL  │
                    │  PUT /profiles/   │
                    │  umkm/:id         │
                    │  (businessName,   │
                    │   businessType,   │
                    │   nib, address)   │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │  VERIFIKASI UMKM  │
                    │  (oleh Moderator/ │
                    │   Super Admin)    │
                    │  is_verified=true │
                    └────────┬──────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │  PASANG KEBUTUHAN │
                    │  POST /internships│
                    │  /needs            │
                    │  (title, slot,    │
                    │   skills, durasi) │
                    └────────┬──────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  LIHAT APPLICANTS        │
              │  GET /matchmaking        │
              │  → lihat siswa yg apply  │
              │   ke kebutuhan UMKM      │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │  RESPON MATCH            │
              │  POST /matchmaking/:id/  │
              │  respond                  │
              │  → accept/reject         │
              │  Jika kedua pihak accept │
              │  → internship otomatis   │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │  MONITOR INTERNSHIP      │
              │  GET /internships/list   │
              │  → lihat progress siswa  │
              │  PATCH .../status        │
              │  (active → completed)    │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │  EVALUASI                │
              │  POST /evaluations       │
              │  (rating + review)       │
              └──────────────────────────┘
```

**Ringkasan Endpoint UMKM:**

| Urutan | Endpoint | Method | Deskripsi |
|--------|----------|--------|-----------|
| 1 | `/auth/register` | POST | Daftar akun (role: umkm) |
| 2 | `/auth/login` | POST | Login → JWT |
| 3 | `/profiles/umkm/:id` | PUT | Lengkapi profil UMKM |
| 4 | `/internships/needs` | POST | Pasang kebutuhan magang |
| 5 | `/internships/needs/:id` | PUT | Edit kebutuhan |
| 6 | `/internships/needs/:id/status` | PATCH | Ubah status (open/closed/filled) |
| 7 | `/matchmaking` | GET | Lihat match & applicants |
| 8 | `/matchmaking/:id/respond` | POST | Terima/tolak student |
| 9 | `/internships/list` | GET | Monitor internship |
| 10 | `/internships/list/:id/status` | PATCH | Update status internship |
| 11 | `/evaluations` | POST | Evaluasi student |

---

### 3.3 Admin Flow

#### A. Super Admin (role_level: `superadmin`)

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN DASHBOARD                        │
│  GET /admin/dashboard                                            │
│  → statistik: total siswa, UMKM, admin, internship aktif,       │
│    match pending, internship selesai, UMKM belum verifikasi     │
└─────────────────────────────────────────────────────────────────┘

┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│  KELOLA USER  │  │  KELOLA SOAL │  │  MATCH       │  │ TIKET   │
│  CRUD /admin/ │  │  CRUD /skill-│  │  OVERRIDE    │  │ CRUD    │
│  users        │  │  test/       │  │  POST /match-│  │ /admin/ │
│               │  │  questions   │  │  making      │  │ tickets │
│  Buat admin   │  │              │  │  (manual     │  │         │
│  POST /admin/ │  │  Nonaktifkan │  │   create     │  │ Lihat & │
│  admins       │  │  DELETE      │  │   match)     │  │ tangani │
└───────────────┘  └──────────────┘  └──────────────┘  └──────────┘
```

#### B. Moderator (role_level: `moderator`)

```
┌─────────────────────────────────────────────────────────────────┐
│                        MODERATOR DASHBOARD                       │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────┐     │
│  │ VERIFIKASI UMKM     │    │ KELOLA BANK SOAL            │     │
│  │ GET /profiles/umkm  │    │ GET /skill-test/questions    │     │
│  │ → lihat UMKM belum  │    │ → lihat, buat, edit soal    │     │
│  │   terverifikasi     │    │ (multiple_choice / essay)   │     │
│  │ PATCH .../verify    │    │                             │     │
│  │ → set verified      │    │ DELETE = soft-delete        │     │
│  └─────────────────────┘    │ (isActive = false)          │     │
│                              └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

#### C. Support (role_level: `support`)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPPORT DASHBOARD                        │
│                                                                  │
│  Hanya bisa melihat tiket yang di-assign ke dirinya sendiri:    │
│  GET /admin/tickets → filter by assignedTo = req.user.userId   │
│                                                                  │
│  ┌────────────────────────────────────────────────┐              │
│  │  TIKET BANTUAN                                 │              │
│  │  GET /admin/tickets/:id → detail tiket         │              │
│  │  PATCH /admin/tickets/:id → update status /    │              │
│  │    priority / assignedTo                       │              │
│  │  DELETE /admin/tickets/:id → hapus tiket       │              │
│  └────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

**Ringkasan Endpoint Admin:**

| Urutan | Endpoint | Method | Role | Deskripsi |
|--------|----------|--------|------|-----------|
| 1 | `/admin/dashboard` | GET | admin | Statistik dashboard |
| 2 | `/admin/users` | GET | admin | Daftar semua user |
| 3 | `/admin/users/:id` | GET | admin | Detail user |
| 4 | `/admin/users/:id` | PATCH | admin | Edit user |
| 5 | `/admin/users/:id` | DELETE | superadmin | Hapus user |
| 6 | `/admin/admins` | GET | admin | Daftar admin |
| 7 | `/admin/admins` | POST | superadmin | Buat admin baru |
| 8 | `/profiles/umkm/:id/verify` | PATCH | admin/moderator | Verifikasi UMKM |
| 9 | `/skill-test/questions` | POST | admin/moderator | Buat soal |
| 10 | `/skill-test/questions/:id` | PUT | admin/moderator | Edit soal |
| 11 | `/skill-test/questions/:id` | DELETE | admin/moderator | Nonaktifkan soal |
| 12 | `/matchmaking` | POST | admin | Manual create match |
| 13 | `/admin/tickets` | POST | admin/support | Buat tiket baru |
| 14 | `/admin/tickets` | GET | admin/support | Lihat tiket |
| 15 | `/admin/tickets/:id` | GET | admin/support | Detail tiket |
| 16 | `/admin/tickets/:id` | PATCH | admin/support | Update tiket |
| 17 | `/admin/tickets/:id` | DELETE | admin/support | Hapus tiket |

---

## 4. End-to-End Business Flow

### 4.1 Skill Test Lifecycle

```
                        SKILL TEST LIFECYCLE
   ───────────────────────────────────────────────────────────

   FASE ADMIN (PERSIAPAN SOAL)
   ┌─────────────────────────────────────────────────────────┐
   │  1. Admin/Moderator membuat soal                        │
   │     POST /skill-test/questions                          │
   │     → 3 tipe: multiple_choice, essay, coding            │
   │     → Multiple choice: options [{label, text}]          │
   │     → Set correctAnswer untuk auto-grade                │
   │                                                        │
   │  2. Soal bisa dinonaktifkan (soft-delete)               │
   │     DELETE /skill-test/questions/:id                    │
   │     → isActive = false (tidak muncul di tes)            │
   └─────────────────────────────────────────────────────────┘

   FASE SISWA (PENGERJAAN TES)
   ┌─────────────────────────────────────────────────────────┐
   │  3. Siswa memulai attempt                               │
   │     POST /skill-test/attempts                           │
   │     → Cek apakah ada attempt in_progress sebelumnya:    │
   │        - Jika ADA dan < 15 menit → ERROR                │
   │        - Jika ADA dan >= 15 menit → auto-expire         │
   │        - Jika TIDAK ADA → buat attempt baru             │
   │     → Ambil 20 soal acak dari pool aktif                │
   │     → Return: attemptId, questions (tanpa jawaban),     │
   │       timeLimit: 15 menit                               │
   │                                                        │
   │  4. Siswa menjawab soal (di frontend)                   │
   │     → Multiple choice: klik label option                │
   │     → Essay: tulis di textarea                          │
   │     → Jawaban disimpan di reactive state (answers)      │
   │                                                        │
   │  5. Submit jawaban                                      │
   │     POST /skill-test/attempts/:id/submit                │
   │     → Server auto-grade multiple_choice:                │
   │        answerText === correctAnswer → isCorrect = true  │
   │     → Essay: isCorrect = null (tidak auto-grade)        │
   │     → Hitung overallScore = (total / maxScore) * 100    │
   │     → Update attempt: status = "completed"              │
   │     → Insert skill_test_results                         │
   │     → Return: { message, score }                        │
   └─────────────────────────────────────────────────────────┘

   FASE REVIEW
   ┌─────────────────────────────────────────────────────────┐
   │  6. Lihat hasil tes                                     │
   │     GET /skill-test/results → semua hasil siswa         │
   │     GET /skill-test/results/:id → detail + attempt      │
   │                                                        │
   │  7. Lihat riwayat attempt                               │
   │     GET /skill-test/attempts → semua attempt siswa      │
   │     GET /skill-test/attempts/:id → detail + jawaban    │
   └─────────────────────────────────────────────────────────┘

   STATUS ATTEMPT:
   ┌─────────────────────────────────────────────────────────┐
   │    ┌─────────────┐                                      │
   │    │ in_progress │───(submit)──▶ ┌───────────┐          │
   │    └─────────────┘               │ completed │          │
   │          │                       └───────────┘          │
   │          │(auto-expire >15m)                             │
   │          ▼                                               │
   │    ┌───────────┐                                         │
   │    │  expired  │                                         │
   │    └───────────┘                                         │
   └─────────────────────────────────────────────────────────┘
```

### 4.2 Matchmaking & Internship Lifecycle

```
              MATCHMAKING & INTERNSHIP LIFECYCLE
   ──────────────────────────────────────────────────────────────

   FASE PASANG KEBUTUHAN (UMKM)
   ┌───────────────────────────────────────────────────────────┐
   │  1. UMKM membuat kebutuhan magang                         │
   │     POST /internships/needs                               │
   │     → Syarat: UMKM sudah terverifikasi (is_verified)      │
   │     → Field: title, slotCount, requiredSkills, duration   │
   │     → Status awal: "open"                                 │
   └───────────────────────────────────────────────────────────┘

   FASE APPLY (SISWA)
   ┌───────────────────────────────────────────────────────────┐
   │  2. Siswa melihat kebutuhan yang tersedia                 │
   │     GET /internships/needs?status=open&city=...           │
   │                                                        │
   │  3. Siswa apply ke kebutuhan                             │
   │     POST /matchmaking/apply/:needId                       │
   │     → Cek duplikasi: (studentId, needId) unique           │
   │     → Buat match dengan:                                  │
   │        - status = "pending"                               │
   │        - studentResponse = "accepted"                     │
   │        - umkmResponse = "pending"                         │
   └───────────────────────────────────────────────────────────┘

   FASE KONFIRMASI (KEDUA PIHAK)
   ┌───────────────────────────────────────────────────────────┐
   │  4. UMKM merespon match                                   │
   │     POST /matchmaking/:id/respond { response }            │
   │     → reject: status = "rejected"                         │
   │     → accept + siswa sudah accept:                         │
   │        - status = "accepted"                              │
   │        - matchedAt = now()                                 │
   │        - INTERNSHIP OTOMATIS DIBUAT:                       │
   │          INSERT internships (scheduled, 14 hari)           │
   │        - slotFilled++ pada need                            │
   │        - Jika slotFilled >= slotCount → need status =     │
   │          "filled"                                          │
   │                                                        │
   │  5. Jika UMKM accept dulu, siswa juga perlu respond       │
   │     → Logika sama: jika kedua accept → internship dibuat  │
   └───────────────────────────────────────────────────────────┘

   FASE INTERNSHIP
   ┌───────────────────────────────────────────────────────────┐
   │  6. Internship berjalan (default 14 hari)                 │
   │     GET /internships/list → lihat daftar internship       │
   │                                                        │
   │  7. Student mengisi daily log                             │
   │     POST /internships/list/:id/daily-log                  │
   │     → Append entry ke dailyLog (JSON array)               │
   │                                                        │
   │  8. Update status internship                              │
   │     PATCH /internships/list/:id/status                    │
   │     → scheduled → active                                  │
   │     → active → completed:                                 │
   │        - completedAt = now()                              │
   │        - SERTIFIKAT OTOMATIS DIBUAT                        │
   │     → any → cancelled (dengan cancelReason)               │
   └───────────────────────────────────────────────────────────┘

   FASE EVALUASI & SERTIFIKAT
   ┌───────────────────────────────────────────────────────────┐
   │  9. Kedua pihak evaluasi                                  │
   │     POST /evaluations { internshipId, rating, review }   │
   │     → constraint: (internshipId, evaluatorRole) unique    │
   │     → Masing-masing hanya bisa evaluasi sekali            │
   │                                                        │
   │ 10. Student melihat/mengunduh sertifikat                  │
   │     GET /certificates                                     │
   │     → Sertifikat sudah dibuat otomatis saat internship    │
   │       status berubah menjadi "completed"                  │
   └───────────────────────────────────────────────────────────┘

   STATUS INTERNSHIP:
   ┌───────────────────────────────────────────────────────────┐
   │  ┌───────────┐    ┌────────┐    ┌───────────┐            │
   │  │ scheduled │───▶│ active │───▶│ completed │            │
   │  └───────────┘    └────────┘    └───────────┘            │
   │        │              │                                   │
   │        │              │                                   │
   │        ▼              ▼                                   │
   │  ┌───────────┐  ┌───────────┐                             │
   │  │ cancelled │  │ cancelled │                             │
   │  └───────────┘  └───────────┘                             │
   └───────────────────────────────────────────────────────────┘

   STATUS MATCH:
   ┌───────────────────────────────────────────────────────────┐
   │  ┌─────────┐                                               │
   │  │ pending │──(both accept)──▶ ┌──────────┐               │
   │  └─────────┘                    │ accepted │               │
   │       │                         └──────────┘               │
   │       │                                                   │
   │       ├──(either reject)──────▶ ┌──────────┐              │
   │       │                         │ rejected │              │
   │       │                         └──────────┘              │
   │       │                                                   │
   │       └──(auto/timeout)───────▶ ┌─────────┐               │
   │                                 │ expired │               │
   │                                 └─────────┘               │
   └───────────────────────────────────────────────────────────┘
```

### 4.3 Support Ticket Flow

```
                      SUPPORT TICKET FLOW
   ─────────────────────────────────────────────────────────────

   ┌───────────────────────────────────────────────────────────┐
   │  1. Admin/support membuat tiket                            │
   │     POST /admin/tickets { userId, subject, body }         │
   │     → Status awal: "open"                                  │
   │     → Priority default: "medium"                           │
   │                                                        │
   │  2. Support admin login                                    │
   │     → Support hanya bisa melihat tiket yang di-assign     │
   │       ke dirinya (filter by assignedTo)                   │
   │                                                        │
   │  3. Lihat daftar tiket                                     │
   │     GET /admin/tickets?status=open                         │
   │     → Filter by status (open/in_progress/resolved/closed)  │
   │                                                        │
   │  4. Lihat detail tiket                                     │
   │     GET /admin/tickets/:id                                 │
   │                                                        │
   │  5. Update tiket                                           │
   │     PATCH /admin/tickets/:id                               │
   │     → Ubah status, priority, assignedTo                    │
   │     → Jika status resolved/closed → set resolvedAt         │
   │                                                        │
   │  6. Hapus tiket                                            │
   │     DELETE /admin/tickets/:id                              │
   └───────────────────────────────────────────────────────────┘

   STATUS TICKET:
   ┌───────────────────────────────────────────────────────────┐
   │   ┌──────┐    ┌────────────┐    ┌──────────┐             │
   │   │ open │───▶│ in_progress │───▶│ resolved │             │
   │   └──────┘    └────────────┘    └──────────┘             │
   │                                      │                    │
   │                                      ▼                    │
   │                                 ┌────────┐                │
   │                                 │ closed │                │
   │                                 └────────┘                │
   └───────────────────────────────────────────────────────────┘
```

---

## 5. API Integration Map

### 5.1 Authentication

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| POST | `/auth/register` | ❌ | public | `register` | Daftar akun baru + buat profile sesuai role |
| POST | `/auth/login` | ❌ | public | `login` | Login email + password → JWT |
| GET | `/auth/me` | ✅ | any | `me` | Data user + profile sesuai role |

### 5.2 Profiles

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/profiles/students` | ✅ | any | `getStudents` | Daftar semua siswa |
| GET | `/profiles/students/:id` | ✅ | any | `getStudent` | Detail siswa by student ID |
| PUT | `/profiles/students/:id` | ✅ | self/admin | `updateStudent` | Edit profil siswa |
| DELETE | `/profiles/students/:id` | ✅ | admin | `deleteStudent` | Hapus siswa + user |
| GET | `/profiles/umkm` | ❌ | public | `getUmkm` | Daftar UMKM (public) |
| GET | `/profiles/umkm/:id` | ❌ | public | `getUmkmDetail` | Detail UMKM (public) |
| PUT | `/profiles/umkm/:id` | ✅ | self/admin | `updateUmkm` | Edit profil UMKM |
| DELETE | `/profiles/umkm/:id` | ✅ | admin | `deleteUmkm` | Hapus UMKM + user |
| PATCH | `/profiles/umkm/:id/verify` | ✅ | admin/moderator | `verifyUmkm` | Verifikasi UMKM |
| GET | `/profiles/admins` | ✅ | admin | `getAdmins` | Daftar admin |
| GET | `/profiles/admins/:id` | ✅ | admin | `getAdmin` | Detail admin |
| PUT | `/profiles/admins/:id` | ✅ | admin | `updateAdmin` | Edit admin (superadmin only untuk roleLevel) |

### 5.3 Internship Needs

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/internships/needs` | ❌ | public | `getNeeds` | Daftar kebutuhan (filter: status, city, major) |
| GET | `/internships/needs/:id` | ❌ | public | `getNeed` | Detail kebutuhan + UMKM info |
| POST | `/internships/needs` | ✅ | umkm/admin | `createNeed` | Buat kebutuhan baru (UMKM harus verified) |
| PUT | `/internships/needs/:id` | ✅ | self/admin | `updateNeed` | Edit kebutuhan (tidak bisa jika filled) |
| DELETE | `/internships/needs/:id` | ✅ | admin | `deleteNeed` | Hapus kebutuhan |
| PATCH | `/internships/needs/:id/status` | ✅ | umkm/admin | `updateNeedStatus` | Ubah status (open/closed/filled) |

### 5.4 Internships (Aktif)

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/internships/list` | ✅ | any | `getInternships` | Daftar internship (scoped by role) |
| GET | `/internships/list/:id` | ✅ | any | `getInternship` | Detail internship + daily log |
| PATCH | `/internships/list/:id/status` | ✅ | any | `updateInternshipStatus` | Update status (auto-certificate jika completed) |
| POST | `/internships/list/:id/daily-log` | ✅ | student | `addDailyLog` | Tambah log harian |

### 5.5 Skill Test

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/skill-test/questions` | ❌ | public | `getQuestions` | Daftar soal aktif |
| GET | `/skill-test/questions/:id` | ❌ | public | `getQuestion` | Detail soal |
| POST | `/skill-test/questions` | ✅ | admin/moderator | `createQuestion` | Buat soal (multiple_choice/essay) |
| PUT | `/skill-test/questions/:id` | ✅ | admin/moderator | `updateQuestion` | Edit soal |
| DELETE | `/skill-test/questions/:id` | ✅ | admin/moderator | `deleteQuestion` | Nonaktifkan soal (soft delete) |
| POST | `/skill-test/attempts` | ✅ | student | `startAttempt` | Mulai tes (20 soal, 15 menit) |
| GET | `/skill-test/attempts` | ✅ | student | `getAttempts` | Riwayat attempt |
| GET | `/skill-test/attempts/:id` | ✅ | any | `getAttempt` | Detail attempt + jawaban |
| POST | `/skill-test/attempts/:id/submit` | ✅ | student | `submitAttempt` | Submit + auto-grade |
| GET | `/skill-test/results` | ✅ | any | `getResults` | Hasil tes (scoped by role) |
| GET | `/skill-test/results/:id` | ✅ | any | `getResult` | Detail hasil + attempt |

### 5.6 Matchmaking

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/matchmaking` | ✅ | any | `getMatches` | Daftar match (scoped by role) |
| GET | `/matchmaking/:id` | ✅ | any | `getMatch` | Detail match |
| POST | `/matchmaking/:id/respond` | ✅ | student/umkm | `respondToMatch` | Accept/reject match |
| POST | `/matchmaking/apply/:needId` | ✅ | student | `studentApplyToNeed` | Student apply langsung |
| POST | `/matchmaking` | ✅ | admin | `createMatch` | Admin buat match manual |

### 5.7 Evaluations

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| POST | `/evaluations` | ✅ | student/umkm | `createEvaluation` | Buat evaluasi (rating + review) |
| GET | `/evaluations` | ✅ | any | `getEvaluations` | Daftar evaluasi (scoped by role) |
| GET | `/evaluations/:id` | ✅ | any | `getEvaluation` | Detail evaluasi |

### 5.8 Certificates

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/certificates` | ✅ | any | `getCertificates` | Daftar sertifikat (student lihat sendiri) |
| GET | `/certificates/:id` | ✅ | any | `getCertificate` | Detail sertifikat + relasi |

### 5.9 Notifications

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/notifications` | ✅ | any | `getNotifications` | Notifikasi user (filter: isRead, type) |
| PATCH | `/notifications/:id/read` | ✅ | any | `markNotificationRead` | Tandai sudah dibaca |
| PATCH | `/notifications/read-all` | ✅ | any | `markAllNotificationsRead` | Tandai semua sudah dibaca |

### 5.10 Admin

| Method | Endpoint | Auth | Role | Controller | Deskripsi |
|--------|----------|------|------|------------|-----------|
| GET | `/admin/dashboard` | ✅ | admin | `getDashboardStats` | Statistik dashboard |
| GET | `/admin/users` | ✅ | admin | `getUsers` | Daftar user (filter: role, q) |
| GET | `/admin/users/:id` | ✅ | admin | `getUser` | Detail user |
| PATCH | `/admin/users/:id` | ✅ | admin | `updateUser` | Edit user (role hanya superadmin) |
| DELETE | `/admin/users/:id` | ✅ | admin | `deleteUser` | Hapus user + profile |
| GET | `/admin/admins` | ✅ | admin | `getAllAdmins` | Daftar admin |
| POST | `/admin/admins` | ✅ | superadmin | `createAdmin` | Buat admin baru |
| POST | `/admin/tickets` | ✅ | admin/support | `createTicket` | Buat tiket baru |
| GET | `/admin/tickets` | ✅ | admin/support | `getTickets` | Daftar tiket (support: filter assigned) |
| GET | `/admin/tickets/:id` | ✅ | admin/support | `getTicket` | Detail tiket |
| PATCH | `/admin/tickets/:id` | ✅ | admin/support | `updateTicket` | Update tiket |
| DELETE | `/admin/tickets/:id` | ✅ | admin/support | `deleteTicket` | Hapus tiket |

---

## 6. Frontend-Backend Integration

### 6.1 Mapping Halaman ke API

| Halaman (Route) | Component | API Endpoints Dipanggil |
|-----------------|-----------|------------------------|
| `/login` | `LoginPage` | `POST /auth/login` |
| `/register` | `RegisterPage` | `POST /auth/register` |
| `/dashboard` | `DashboardPage` → `StudentView` / `UmkmView` / `AdminDashboardPage` | `GET /auth/me`, `GET /internships/list`, `GET /matchmaking`, `GET /certificates`, `GET /skill-test/results`, `GET /notifications` |
| `/skill-test` | `SkillTestPage` | `POST /skill-test/attempts`, `POST /skill-test/attempts/:id/submit`, `GET /skill-test/results` |
| `/internship-needs/browse` | `InternshipNeedsBrowse` | `GET /internships/needs` |
| `/internship-needs/new` | `InternshipNeedNew` | `POST /internships/needs` |
| `/matchmaking` | `MatchmakingPage` | `GET /matchmaking`, `POST /matchmaking/:id/respond`, `POST /matchmaking/apply/:needId` |
| `/internships/:id` | `InternshipDetailPage` | `GET /internships/list/:id`, `POST /internships/list/:id/daily-log` |
| `/internships/:id/evaluate` | `EvaluationPage` | `POST /evaluations` |
| `/admin/dashboard` | `AdminDashboardView` | `GET /admin/dashboard` |
| `/admin/users` | `AdminUsersView` | `GET /admin/users`, `PATCH /admin/users/:id`, `DELETE /admin/users/:id` |
| `/admin/verification` | `AdminVerificationView` | `GET /profiles/umkm`, `PATCH /profiles/umkm/:id/verify` |
| `/admin/questions` | `AdminQuestionsView` | `GET /skill-test/questions`, `POST /skill-test/questions`, `PUT /skill-test/questions/:id`, `DELETE /skill-test/questions/:id` |
| `/admin/internships` | `AdminInternshipsView` | `GET /internships/needs`, `GET /internships/list` |
| `/admin/matches` | `AdminMatchesView` | `GET /matchmaking`, `POST /matchmaking` |
| `/admin/tickets` | `AdminTicketsView` | `GET /admin/tickets`, `PATCH /admin/tickets/:id`, `DELETE /admin/tickets/:id` |

### 6.2 JWT Auth Flow

```
  ┌───────────────────────────────────────────────────────────────┐
  │                     JWT AUTH FLOW                              │
  │                                                               │
  │  1. USER LOGIN                                                │
  │     POST /auth/login → { token, user }                        │
  │     → Token disimpan di localStorage                          │
  │                                                               │
  │  2. AUTH STATE (Pinia store)                                  │
  │     auth.js → authStore:                                      │
  │       - initialize: baca token dari localStorage              │
  │       - decode JWT payload → dapat userId, role, email        │
  │       - auto-call GET /auth/me untuk validasi                 │
  │                                                               │
  │  3. SETIAP REQUEST                                            │
  │     api.js (custom wrapper axios/fetch):                      │
  │       - attach header: Authorization: Bearer <token>          │
  │       - jika response 401 → redirect ke /login                │
  │                                                               │
  │  4. SERVER VERIFIKASI                                         │
  │     middleware/auth.js → authenticate:                        │
  │       - extract Bearer token                                  │
  │       - jwt.verify(token, JWT_SECRET)                         │
  │       - req.user = { userId, role, email }                    │
  │                                                               │
  │  5. ROLE GUARD                                                │
  │     middleware/auth.js → authorize(roles):                    │
  │       - cek req.user.role ∈ allowedRoles                      │
  │       - jika tidak → 403 Forbidden                            │
  └───────────────────────────────────────────────────────────────┘
```

### 6.3 Error Handling Pattern

```
  CLIENT                                    SERVER
  ──────                                    ──────
  try {                                      asyncHandler(fn) → catch(next)
    const res = await api.post(...)           ↓
  } catch (e) {                             AppError(message, statusCode)
    errorMsg = e.message                     ↓
  }                                         errorHandler(err, req, res, next)
                                             ↓
                                            res.status(statusCode).json({
                                              error: message,
                                              stack: (dev only)
                                            })

  Kode Status yang Digunakan:
  ─────────────────────────
  200  → Success (GET, PUT, PATCH)
  201  → Created (POST)
  400  → Bad Request (validasi, duplicate, business logic)
  401  → Unauthorized (no token / invalid token)
  403  → Forbidden (role mismatch)
  404  → Not Found (resource tidak ada)
  409  → Conflict (duplicate entry)
  500  → Internal Server Error (unhandled)

  Custom Error Class:
  ──────────────────
  AppError extends Error {
    constructor(message, statusCode) {
      this.statusCode = statusCode
      this.isOperational = true
    }
  }
```

---

## 7. State Machine

### 7.1 Skill Test Attempt

```
                         ┌────────────────────┐
                         │     in_progress     │
                         │ (tes sedang jalan)  │
                         └─────────┬───────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
            ┌────────────────┐         ┌──────────────────┐
            │   completed    │         │     expired      │
            │ (submit sukses)│         │ (auto > 15 menit)│
            └────────────────┘         └──────────────────┘
```

**Trigger:**
- `in_progress → completed`: `POST /skill-test/attempts/:id/submit`
- `in_progress → expired`: Auto-expire saat attempt baru (jika sudah > 15 menit)

### 7.2 Match

```
                         ┌────────────────────┐
                         │      pending       │
                         │ (menunggu respon)  │
                         └─────────┬───────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
            ┌────────────────┐         ┌──────────────────┐
            │   accepted      │         │    rejected      │
            │ (kedua setuju)  │         │ (salah satu tolak)│
            │ → internship    │         └──────────────────┘
            │   otomatis dibuat│
            └────────────────┘
```

**Trigger:**
- `pending → accepted`: `POST /matchmaking/:id/respond` (kedua pihak accept)
- `pending → rejected`: `POST /matchmaking/:id/respond` (salah satu reject)

### 7.3 Internship

```
  ┌────────────┐    ┌──────────┐    ┌────────────┐
  │ scheduled  │───▶│  active  │───▶│ completed  │
  │ (baru buat)│    │ (berjalan)│    │ (selesai)  │
  └────────────┘    └──────────┘    └─────┬──────┘
        │                │                │
        ▼                ▼                ▼
  ┌────────────┐    ┌──────────┐    ┌──────────────┐
  │ cancelled  │    │ cancelled │    │ [certificate │
  │            │    │           │    │  otomatis]   │
  └────────────┘    └──────────┘    └──────────────┘
```

**Trigger:**
- `scheduled → active`: `PATCH /internships/list/:id/status`
- `active → completed`: `PATCH /internships/list/:id/status` (auto-create certificate)
- `any → cancelled`: `PATCH /internships/list/:id/status` (dengan cancelReason)

### 7.4 Support Ticket

```
  ┌────────┐    ┌──────────────┐    ┌────────────┐
  │  open  │───▶│ in_progress  │───▶│  resolved  │
  │ (baru) │    │ (dikerjakan) │    │ (selesai)  │
  └────────┘    └──────────────┘    └──────┬─────┘
                                           │
                                           ▼
                                      ┌─────────┐
                                      │  closed  │
                                      │ (ditutup)│
                                      └─────────┘
```

**Trigger:**
- `open → in_progress`: `PATCH /admin/tickets/:id`
- `in_progress → resolved`: `PATCH /admin/tickets/:id` (set resolvedAt)
- `resolved → closed`: `PATCH /admin/tickets/:id`

---

## 8. Database Relationship Map

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      ENTITY RELATIONSHIP DIAGRAM                         │
  │                                                                          │
  │  ┌───────┐      ┌───────────┐      ┌────────────────────┐               │
  │  │ users │──────│ students  │──────│ skill_test_attempts │               │
  │  │       │1   1 │           │1   N │                    │               │
  │  │ PK id │      │ PK id     │      │ PK id               │               │
  │  │       │      │ FK user_id│      │ FK student_id       │               │
  │  │ role  │      │ school    │      │ status              │               │
  │  │ email │      │ major     │      │ totalScore          │               │
  │  │ phone │      │ skills    │      └────────┬───────────┘               │
  │  └───┬───┘      └───────────┘               │                           │
  │      │                                       │                           │
  │      │      ┌───────────┐      ┌─────────────┼───────────────┐          │
  │      │──────│ umkm      │      │             │               │          │
  │      │1   1 │           │      ▼             ▼               ▼          │
  │      │      │ PK id     │  ┌────────────┐ ┌──────────┐ ┌────────────┐  │
  │      │      │ FK user_id│  │skill_test_ │ │skill_test│ │skill_test  │  │
  │      │      │ businessNm│  │ answers    │ │ results  │ │ results    │  │
  │      │      │ isVerified│  │ PK id      │ │ PK id    │ │ PK id      │  │
  │      │      └─────┬─────┘  │ FK attempt │ │ FK stud  │ │ FK attempt │  │
  │      │             │       │ FK question│ │ overall  │ │ (unique)   │  │
  │      │             │       └────────────┘ │ score    │ │            │  │
  │      │             │                      └──────────┘ └────────────┘  │
  │      │      ┌──────┴────────────┐                                      │
  │      │      │ internship_needs  │        ┌────────────────────┐        │
  │      │      │ PK id             │────────│ matchmaking         │        │
  │      │      │ FK umkm_id        │N     1│ PK id               │        │
  │      │      │ title             │        │ FK student_id       │        │
  │      │      │ slotCount         │        │ FK need_id          │        │
  │      │      │ status            │        │ status              │        │
  │      │      └───────────────────┘        │ studentResponse     │        │
  │      │                                   │ umkmResponse        │        │
  │      │                                   └──────────┬──────────┘        │
  │      │                                              │1                  │
  │      │                                   ┌──────────┴──────────┐       │
  │      │                                   │   internships       │       │
  │      │                                   │   PK id             │       │
  │      │                                   │   FK match_id (uniq)│       │
  │      │                                   │   FK student_id     │       │
  │      │                                   │   FK umkm_id        │       │
  │      │                                   │   status            │       │
  │      │                                   │   dailyLog          │       │
  │      │                                   └──────────┬──────────┘       │
  │      │                                              │                   │
  │      │                    ┌─────────────────────────┼──────┐           │
  │      │                    │                         │      │           │
  │      │                    ▼                         ▼      │           │
  │      │           ┌──────────────┐          ┌──────────┐   │           │
  │      │           │ evaluations   │          │certificates│  │           │
  │      │           │ PK id        │          │ PK id     │  │           │
  │      │           │ FK intern-id │          │ FK intern │  │           │
  │      │           │ evaluatorRole│          │ FK student│  │           │
  │      │           │ rating 1-5   │          │ certNum   │  │           │
  │      │           └──────────────┘          └──────────┘   │           │
  │      │                                                   │           │
  │      │      ┌──────────────┐        ┌──────────────────┐ │           │
  │      │──────│ notifications│        │ support_tickets  │ │           │
  │      └──────│ PK id        │        │ PK id            │ │           │
  │             │ FK user_id   │        │ user_id          │ │           │
  │             │ type         │        │ subject          │ │           │
  │             │ isRead       │        │ status           │ │           │
  │             └──────────────┘        │ priority         │ │           │
  │                                     └──────────────────┘ │           │
  │                                                           │           │
  │      ┌────────────────────────────────────────────────────┘           │
  │      │                    ┌──────────┐                               │
  │      └────────────────────│ admins   │                               │
  │                         1│ PK id    │                               │
  │                           │ FK user  │                               │
  │                           │ roleLevel│                               │
  │                           │ perms    │                               │
  │                           └──────────┘                               │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Legenda Relasi

| Simbol | Arti |
|--------|------|
| `1` | Satu (one) |
| `N` | Banyak (many) |
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `(uniq)` | Unique Constraint |

### Tabel Ringkasan

| No | Tabel | PK | Foreign Keys | Relasi Utama |
|----|-------|----|--------------|--------------|
| 1 | `users` | id | - | Tabel pusat autentikasi |
| 2 | `students` | id | user_id → users.id | Profil siswa (1:1 dengan users) |
| 3 | `umkm` | id | user_id → users.id | Profil UMKM (1:1 dengan users) |
| 4 | `admins` | id | user_id → users.id | Profil admin (1:1 dengan users) |
| 5 | `internship_needs` | id | umkm_id → umkm.id | Kebutuhan magang dari UMKM |
| 6 | `matchmaking` | id | student_id → students.id, need_id → internship_needs.id | Pencocokan siswa-kebutuhan (unique pair) |
| 7 | `internships` | id | match_id → matchmaking.id (unique), student_id → students.id, umkm_id → umkm.id | Magang yang sudah dikonfirmasi |
| 8 | `skill_test_questions` | id | created_by → admins.id | Bank soal |
| 9 | `skill_test_attempts` | id | student_id → students.id | Sesi tes siswa |
| 10 | `skill_test_answers` | id | attempt_id → skill_test_attempts.id, question_id → skill_test_questions.id | Jawaban per soal |
| 11 | `skill_test_results` | id | student_id → students.id, attempt_id → skill_test_attempts.id (unique) | Hasil tes |
| 12 | `evaluations` | id | internship_id → internships.id | Review dua arah (unique per role) |
| 13 | `certificates` | id | student_id → students.id, internship_id → internships.id (unique) | Sertifikat digital |
| 14 | `notifications` | id | user_id → users.id | Riwayat notifikasi |
| 15 | `support_tickets` | id | - | Tiket bantuan |

---

> **Terakhir diperbarui:** Juni 2026
> **Stack:** Vue 3 + Express + Drizzle ORM (MySQL2)
