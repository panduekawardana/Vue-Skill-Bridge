# Skill Bridge — Database Schema

> **Database:** PostgreSQL
> **ORM:** Prisma

---

## Entity Relationship Diagram

```
users (1) ──▶ (0..1) students ──▶ (0..N) skill_test_attempts ──▶ (0..N) skill_test_answers
                                  ──▶ (0..N) skill_test_results
                                  ──▶ (0..N) matchmaking
                                  ──▶ (0..N) internships
                                  ──▶ (0..N) certificates

users (1) ──▶ (0..1) umkm ──▶ (0..N) internship_needs
                            ──▶ (0..N) matchmaking
                            ──▶ (0..N) internships

users (1) ──▶ (0..1) admins

matchmaking (1) ──▶ (0..1) internships ──▶ (0..N) evaluations
skill_test_attempts (1) ──▶ (0..N) skill_test_answers
                           ──▶ (0..1) skill_test_results

users (1) ──▶ (0..N) notifications
```

---

## Definisi Tabel

### `users`

Tabel pusat autentikasi & identitas dasar semua pengguna.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Nomor WhatsApp untuk OTP & notifikasi |
| password_hash | VARCHAR(255) | NOT NULL | |
| full_name | VARCHAR(150) | NOT NULL | |
| role | ENUM('student','umkm','admin') | NOT NULL | |
| avatar_url | TEXT | | |
| is_verified | BOOLEAN | NOT NULL, DEFAULT false | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `students`

Data profil spesifik untuk pengguna dengan role `student`.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | |
| nisn | VARCHAR(20) | UNIQUE | Nomor Induk Siswa Nasional |
| school | VARCHAR(200) | NOT NULL | Asal SMK |
| major | VARCHAR(100) | NOT NULL | Jurusan (TKJ, AKL, BDP, dll) |
| graduation_year | INT | | |
| bio | TEXT | | |
| skills | JSONB | | Array of skill names: `["JavaScript","Desain Grafis"]` |
| portfolio_url | TEXT | | Link portofolio eksternal |
| address | TEXT | | |
| city | VARCHAR(100) | | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `umkm`

Data profil spesifik untuk pengguna dengan role `umkm`.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | |
| business_name | VARCHAR(200) | NOT NULL | Nama usaha |
| business_type | VARCHAR(100) | NOT NULL | Bidang usaha |
| nib | VARCHAR(50) | | Nomor Induk Berusaha |
| tax_id | VARCHAR(50) | | NPWP (opsional) |
| description | TEXT | | |
| address | TEXT | | |
| city | VARCHAR(100) | | |
| phone_office | VARCHAR(20) | | |
| website | TEXT | | |
| logo_url | TEXT | | |
| is_verified | BOOLEAN | NOT NULL, DEFAULT false | Status verifikasi legalitas |
| verified_at | TIMESTAMP | | |
| verified_by | UUID | FK → admins.id | Admin yang memverifikasi |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `admins`

Data profil spesifik untuk pengguna dengan role `admin`.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | |
| role_level | ENUM('superadmin','moderator','support') | NOT NULL | |
| permissions | JSONB | NOT NULL | Array permission flags: `["manage_users","manage_questions"]` |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `internship_needs`

Kebutuhan magang yang dipasang oleh UMKM.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| umkm_id | UUID | FK → umkm.id, NOT NULL | |
| title | VARCHAR(200) | NOT NULL | Contoh: "Dibutuhkan 1 Social Media Specialist" |
| description | TEXT | | |
| required_skills | JSONB | | `["Canva","Copywriting","Meta Ads"]` |
| required_major | VARCHAR(100) | | Jurusan preferensi (opsional) |
| slot_count | INT | NOT NULL | Jumlah siswa dibutuhkan |
| slot_filled | INT | NOT NULL, DEFAULT 0 | |
| start_date | DATE | | Perkiraan tanggal mulai |
| duration_days | INT | NOT NULL, DEFAULT 14 | |
| compensation | VARCHAR(100) | | "Rp 500.000" atau "Uang Transport" |
| status | ENUM('open','closed','filled') | NOT NULL, DEFAULT 'open' | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `skill_test_questions`

Bank soal untuk skill test adaptif.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| category | VARCHAR(100) | NOT NULL | "Programming", "Design", "Akuntansi" |
| difficulty | ENUM('beginner','intermediate','advanced') | NOT NULL | |
| question_text | TEXT | NOT NULL | |
| question_type | ENUM('multiple_choice','essay','coding') | NOT NULL | |
| options | JSONB | | Untuk multiple choice: `[{"label":"A","text":"..."}, ...]` |
| correct_answer | TEXT | | Untuk evaluasi otomatis |
| point_value | INT | NOT NULL, DEFAULT 10 | |
| tags | JSONB | | `["javascript","react","css"]` |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete / nonaktifkan soal |
| created_by | UUID | FK → admins.id | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `skill_test_attempts`

Sesi pengerjaan skill test oleh siswa.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| student_id | UUID | FK → students.id, NOT NULL | |
| started_at | TIMESTAMP | NOT NULL | |
| completed_at | TIMESTAMP | | |
| status | ENUM('in_progress','completed','expired') | NOT NULL, DEFAULT 'in_progress' | |
| total_score | INT | | Skor akhir 0-100 |
| adaptive_level | ENUM('beginner','intermediate','advanced') | | Level terakhir yang dicapai dalam tes adaptif |

---

### `skill_test_answers`

Jawaban spesifik untuk setiap soal dalam satu sesi tes.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| attempt_id | UUID | FK → skill_test_attempts.id, NOT NULL | |
| question_id | UUID | FK → skill_test_questions.id, NOT NULL | |
| answer_text | TEXT | | |
| is_correct | BOOLEAN | | |
| score_obtained | INT | | |
| answered_at | TIMESTAMP | NOT NULL | |

---

### `skill_test_results`

Ringkasan hasil tes untuk kebutuhan matchmaking.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| student_id | UUID | FK → students.id, NOT NULL | |
| attempt_id | UUID | FK → skill_test_attempts.id, UNIQUE, NOT NULL | |
| overall_score | INT | | 0-100 |
| skill_breakdown | JSONB | | `{"JavaScript":85,"CSS":70,"React":90}` |
| recommended_roles | JSONB | | `["Frontend Developer","UI Designer"]` |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

### `matchmaking`

Hasil pencocokan antara siswa dan kebutuhan UMKM.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| student_id | UUID | FK → students.id, NOT NULL | |
| need_id | UUID | FK → internship_needs.id, NOT NULL | |
| match_score | DECIMAL(5,2) | | 0.00 - 100.00 |
| match_details | JSONB | | `{"skill_match": 90, "location": 80, "availability": 100}` |
| status | ENUM('pending','accepted','rejected','expired') | NOT NULL, DEFAULT 'pending' | |
| student_response | ENUM('pending','accepted','rejected') | NOT NULL, DEFAULT 'pending' | |
| umkm_response | ENUM('pending','accepted','rejected') | NOT NULL, DEFAULT 'pending' | |
| matched_at | TIMESTAMP | | |
| responded_at | TIMESTAMP | | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

> **UNIQUE Constraint:** (student_id, need_id) — satu pasangan hanya boleh satu baris.

---

### `internships`

Magang mikro yang sudah dikonfirmasi kedua pihak.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| match_id | UUID | FK → matchmaking.id, UNIQUE, NOT NULL | |
| student_id | UUID | FK → students.id, NOT NULL | |
| umkm_id | UUID | FK → umkm.id, NOT NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL | |
| status | ENUM('scheduled','active','completed','cancelled') | NOT NULL, DEFAULT 'scheduled' | |
| daily_log | JSONB | Opsional, array of daily entries | |
| cancelled_at | TIMESTAMP | | |
| cancel_reason | TEXT | | |
| completed_at | TIMESTAMP | | |

---

### `evaluations`

Umpan balik setelah magang selesai dari kedua pihak.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| internship_id | UUID | FK → internships.id, NOT NULL | |
| evaluator_role | ENUM('student','umkm') | NOT NULL | |
| rating | INT | | 1-5 |
| review_text | TEXT | | |
| skill_assessment | JSONB | | `{"kedisiplinan":4,"skill_teknis":5,"komunikasi":3}` |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

> **UNIQUE Constraint:** (internship_id, evaluator_role) — setiap pihak hanya bisa evaluasi sekali.

---

### `certificates`

Sertifikat kompetensi digital yang diterbitkan setelah magang selesai.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| student_id | UUID | FK → students.id, NOT NULL | |
| internship_id | UUID | FK → internships.id, UNIQUE, NOT NULL | |
| certificate_number | VARCHAR(50) | UNIQUE, NOT NULL | Format: `SB-2026-XXXXX` |
| file_url | TEXT | | Link ke file PDF di MinIO |
| metadata | JSONB | | `{"skills_acquired":[...], "duration":"14 days", "score":85}` |
| issued_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| verified_at | TIMESTAMP | | Tanda tangan digital |

---

### `notifications`

Riwayat notifikasi untuk semua pengguna.

| Kolom | Tipe | Konstrain | Keterangan |
|-------|------|-----------|------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| type | ENUM('match','schedule','evaluation','certificate','system') | NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| body | TEXT | | |
| channel | ENUM('in_app','whatsapp','email') | NOT NULL | |
| reference_id | UUID | | ID entitas terkait (internship_id, dll) |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | |
| read_at | TIMESTAMP | | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

## Indexes

| Tabel | Index | Kolom | Alasan |
|-------|-------|-------|--------|
| matchmaking | idx_match_student_status | (student_id, status) | Pencarian rekomendasi aktif siswa |
| matchmaking | idx_match_need_status | (need_id, status) | Pencarian kandidat untuk kebutuhan UMKM |
| internships | idx_internship_status | (status, start_date) | Monitoring magang aktif & jadwal |
| skill_test_results | idx_result_student | (student_id) | Pencarian hasil tes terbaru siswa |
| notifications | idx_notif_user_unread | (user_id, is_read, created_at) | Ambil notifikasi belum dibaca |
| internship_needs | idx_need_umkm_status | (umkm_id, status) | List kebutuhan aktif UMKM |

---

## Enum Values

| Enum | Nilai |
|------|-------|
| users.role | `student`, `umkm`, `admin` |
| admins.role_level | `superadmin`, `moderator`, `support` |
| internship_needs.status | `open`, `closed`, `filled` |
| skill_test_questions.difficulty | `beginner`, `intermediate`, `advanced` |
| skill_test_questions.question_type | `multiple_choice`, `essay`, `coding` |
| skill_test_attempts.status | `in_progress`, `completed`, `expired` |
| matchmaking.status | `pending`, `accepted`, `rejected`, `expired` |
| internships.status | `scheduled`, `active`, `completed`, `cancelled` |
| evaluations.evaluator_role | `student`, `umkm` |
| notifications.type | `match`, `schedule`, `evaluation`, `certificate`, `system` |
| notifications.channel | `in_app`, `whatsapp`, `email` |
