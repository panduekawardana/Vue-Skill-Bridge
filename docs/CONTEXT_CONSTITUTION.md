# Skill Bridge — Context & Constitution

---

## 1. Konteks Sistem

```
┌────────────────────────────────────────────────────────────────┐
│                      EKOSISTEM SKILL BRIDGE                     │
│                                                                 │
│   ┌──────────┐    ┌──────────────┐    ┌──────────┐            │
│   │  SISWA   │───▶│ SKILL BRIDGE │◀───│   UMKM   │            │
│   │   SMK    │    │   PLATFORM   │    │  LOKAL   │            │
│   └──────────┘    └──────────────┘    └──────────┘            │
│        │                 │                      │               │
│        ▼                 ▼                      ▼               │
│   ┌──────────┐    ┌──────────────┐    ┌──────────┐            │
│   │  Skill   │    │   Admin &    │    │  Review  │            │
│   │   Test   │    │ Matchmaking  │    │ & Rating │            │
│   └──────────┘    └──────────────┘    └──────────┘            │
│                                                                 │
│   Aliran Data:                                                  │
│   1. Siswa mengikuti skill test  →  hasil tes masuk database    │
│   2. UMKM upload kebutuhan skill →  masuk ke pool kebutuhan     │
│   3. Algoritma mencocokkan      →  menghasilkan match pair      │
│   4. Konfirmasi kedua pihak     →  magang mikro 2 minggu dimulai│
│   5. Evaluasi akhir             →  sertifikat + review           │
└────────────────────────────────────────────────────────────────┘
```

### Masalah

Lulusan SMK kesulitan kerja karena keterampilan tidak sesuai kebutuhan industri.

### Solusi

Platform matchmaking berbasis **skill test adaptif** yang mempertemukan siswa SMK dengan UMKM lokal untuk **magang mikro 2 minggu**.

### Pembeda

Bukan sekadar portal lowongan — ada **verifikasi kompetensi** via tes adaptif dan **commitment mikro** hanya 14 hari, sehingga risiko rendah bagi kedua pihak.

### Siapa yang Terlibat

| Entitas | Peran | Kepentingan |
|---------|-------|-------------|
| **Siswa SMK** | Pencari pengalaman kerja | Mendapat pengalaman nyata + sertifikat kompetensi |
| **UMKM Lokal** | Penyedia magang | Mendapat tenaga terverifikasi tanpa biaya besar |
| **Admin Platform** | Operator sistem | Menjaga kualitas match, verifikasi, dan moderasi |
| **Pihak Sekolah** | Mitra (opsional) | Menyalurkan lulusan, memonitor progress siswa |

---

## 2. Konstitusi Sistem (Aturan Dasar)

| Aturan | Deskripsi |
|--------|-----------|
| **K1 — Privasi Data** | Data siswa & UMKM tidak boleh dijual/dibocorkan ke pihak ketiga tanpa persetujuan eksplisit |
| **K2 — Kesetaraan Akses** | Semua siswa SMK dari jurusan mana pun berhak mendaftar; tidak ada diskriminasi |
| **K3 — Transparansi Matching** | Algoritma matchmaking harus dapat diaudit dan dijelaskan (bukan black box) |
| **K4 — Verifikasi Berlapis** | Setiap akun UMKM harus melewati verifikasi legalitas sebelum dapat memasang kebutuhan |
| **K5 — Netralitas Platform** | Platform tidak memihak siswa/UMKM tertentu dalam algoritma rekomendasi |
| **K6 — Umpan Balik Wajib** | Setiap magang mikro wajib diakhiri evaluasi dari kedua belah pihak |
| **K7 — Portabilitas Data** | Siswa dapat mengekspor data portofolio dan sertifikat kapan saja |
| **K8 — Keamanan Tes** | Skill test dilindungi dari kecurangan (waktu terbatas, randomisasi soal, anti-cheat detection) |

### 2.1 Matriks Konstitusi vs Fitur

| Aturan | Fitur Terkait |
|--------|---------------|
| K1 — Privasi Data | Semua fitur yang memproses data pribadi |
| K2 — Kesetaraan Akses | Registrasi siswa, matchmaking |
| K3 — Transparansi Matching | Matchmaking otomatis |
| K4 — Verifikasi Berlapis | Registrasi UMKM, verifikasi dokumen |
| K5 — Netralitas Platform | Algoritma matchmaking |
| K6 — Umpan Balik Wajib | Evaluasi & review |
| K7 — Portabilitas Data | Unduh sertifikat, ekspor portofolio |
| K8 — Keamanan Tes | Skill test adaptif |
