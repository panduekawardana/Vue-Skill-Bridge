# Skill Bridge — Product Requirement Document (PRD)

> **Pertanyaan Kunci:** Bagaimana menjembatani lulusan SMK dengan UMKM lokal melalui magang mikro 2 minggu berbasis skill test?
>
> **Jawaban:** Platform matchmaking berbasis kompetensi terverifikasi, mirip Prakerja tapi fokus pada job-matching dengan durasi pendek dan umpan balik langsung dari industri.

---

## Daftar Fitur

| ID | Fitur | Prioritas | Deskripsi | Kriteria Sukses |
|----|-------|-----------|-----------|-----------------|
| PRD-01 | Registrasi & Onboarding Siswa | P0 | Siswa SMK daftar dengan data diri, ijazah, dan portofolio | < 3 menit registrasi; 90% selesai tanpa bantuan |
| PRD-02 | Registrasi & Onboarding UMKM | P0 | UMKM daftar dengan profil usaha, bidang industri, dan alamat | < 5 menit; verifikasi legalitas usaha |
| PRD-03 | Skill Test Adaptif | P0 | Tes berbasis kompetensi teknis & non-teknis (soal menyesuaikan jawaban sebelumnya) | Akurasi pemetaan ≥ 80% |
| PRD-04 | Matchmaking Otomatis | P0 | Algoritma mencocokkan hasil tes siswa dengan kebutuhan UMKM | Match rate ≥ 70% dalam 24 jam |
| PRD-05 | Jadwal Magang Mikro 2 Minggu | P0 | Penjadwalan otomatis 14 hari kerja termasuk orientasi dan evaluasi | 100% peserta mendapat jadwal jelas |
| PRD-06 | Sertifikat Kompetensi | P0 | Sertifikat digital terverifikasi setelah selesai magang | Diterbitkan < 24 jam setelah evaluasi |
| PRD-07 | Review & Rating Dua Arah | P1 | Siswa dan UMKM saling memberi rating dan ulasan | ≥ 80% partisipasi review |
| PRD-08 | Dashboard Monitoring | P1 | Admin melihat statistik real-time: jumlah match, progress, completion rate | Update data ≤ 5 detik |
| PRD-09 | Notifikasi & Reminder | P1 | Pengingat jadwal, tugas, dan evaluasi via WhatsApp/Email | Delivery rate ≥ 95% |
| PRD-10 | Portofolio Digital | P2 | Siswa mengunggah hasil kerja selama magang ke platform | 50% siswa mengunggah minimal 1 karya |
| PRD-11 | Laporan Kinerja UMKM | P2 | UMKM mendapat laporan otomatis kontribusi siswa | Diterbitkan H+1 setelah magang selesai |
| PRD-12 | Marketplace Pelatihan Tambahan | P2 | Mitra pelatihan menyediakan kursus singkat pengayaan skill | 20% siswa mengikuti ≥ 1 kursus tambahan |

---

## Prioritas

| Level | Definisi |
|-------|----------|
| **P0** | *Must have* — Sistem tidak dapat berjalan tanpa fitur ini. Wajib ada di rilis pertama (MVP). |
| **P1** | *Should have* — Penting untuk pengalaman pengguna dan retensi, dapat menyusul di rilis kedua. |
| **P2** | *Nice to have* — Nilai tambah untuk monetisasi atau engagement jangka panjang. |

---

## Alur Utama (User Flow)

```
Registrasi → Skill Test → Dapat Rekomendasi Match → Konfirmasi → Magang 14 Hari → Evaluasi → Sertifikat
```
