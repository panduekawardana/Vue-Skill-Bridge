# Skill Bridge — Architecture Decision Record (ADR)

Dokumen ini mencatat keputusan arsitektur utama beserta opsi yang dipilih, alternatif yang dipertimbangkan, dan alasan di balik setiap keputusan.

> **Catatan:** Dokumen ini telah diperbarui untuk mencerminkan implementasi aktual (Juli 2026).

---

## Daftar Keputusan

| ID | Keputusan | Opsi | Alternatif | Alasan |
|----|-----------|------|-----------|--------|
| ADR-01 | **Frontend:** Vue 3 + Composition API + Vite | Vue 3 | React, Svelte | Ringan, ekosistem matang, cocok untuk dashboard real-time, performa build cepat dengan Vite |
| ADR-02 | **Backend:** Node.js + Express | Node.js | Python/Django, Go | Satu bahasa dengan frontend (JS/TS), event-loop cocok untuk notifikasi real-time, komunitas besar |
| ADR-03 | **Database:** MySQL | MySQL | PostgreSQL, MongoDB | Relasional kuat untuk data kompetensi & matchmaking, dukungan JSON untuk fleksibilitas skor tes |
| ADR-04 | **ORM:** Drizzle ORM | Drizzle | Prisma, TypeORM | Lightweight, type-safe, migrasi mudah, performa tinggi dengan mysql2 driver |
| ADR-05 | **Autentikasi:** JWT | JWT | OAuth Google, SMS | JWT untuk session tanpa state, sederhana untuk MVP |
| ADR-06 | **Matchmaking Engine:** Inline (Node.js) | Node.js | Python microservice | Untuk MVP, algoritma matchmaking diintegrasikan langsung di backend. Dapat dipisahkan nanti jika dibutuhkan. |
| ADR-07 | **Storage:** Local filesystem | Local | MinIO, AWS S3 | Untuk MVP, file disimpan di lokal server. Dapat migrasi ke S3-compatible storage nanti. |
| ADR-08 | **Realtime:** HTTP polling (basic) | HTTP | Socket.IO, SSE | Untuk MVP, notifikasi di-poll setiap 15 detik dari frontend. Real-time penuh dapat ditambahkan nanti. |
| ADR-09 | **Caching:** In-memory rate limiting | In-memory | Redis | Untuk MVP, rate limiting menggunakan in-memory Map. Redis dapat ditambahkan untuk scaling. |
| ADR-10 | **Container:** Docker + Docker Compose | Docker | Kubernetes (berat untuk awal) | Sederhana, reproducible, cukup untuk skala awal SMK-UMKM |
| ADR-11 | **Deployment:** VPS (DigitalOcean/Linode) | VPS | Serverless (Vercel/Lambda) | Kontrol penuh atas infrastruktur, biaya tetap lebih murah untuk traffic menengah |
| ADR-12 | **Monorepo:** Turborepo | Turborepo | Nx, Lerna | Tooling minimal, caching efisien, dokumentasi jelas |

---

## Detail Arsitektur (Aktual)

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
│  │ Rate     │    │ (JWT verify)      │    │ (role-based guard)    │ │
│  │ Limit    │    └──────────────────┘    └───────────┬────────────┘ │
│  └──────────┘                                        │               │
│  ┌───────────────────────────────────────────────────┴───────────┐  │
│  │                      ROUTES (9 domain)                        │  │
│  │  /api/auth  /api/profiles  /api/internships  /api/skill-test  │  │
│  │  /api/matchmaking  /api/evaluations  /api/certificates        │  │
│  │  /api/notifications  /api/admin                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  ORM: Drizzle (mysql2)                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              DATABASE: MySQL (15 tables)                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Penjelasan Alur

1. **Client (Vue 3)** mengirim request ke **API Gateway (Node.js)**
2. API Gateway menangani auth (JWT), routing, rate limiting, dan validasi
3. Data disimpan di **MySQL** melalui **Drizzle ORM**
4. Rate limiting in-memory melindungi endpoint sensitif (login, register)
5. Algoritma matchmaking diintegrasikan langsung di backend (inline)
6. File (sertifikat PDF) disimpan di lokal server
7. HTTP polling untuk notifikasi (interval 15 detik dari frontend)
