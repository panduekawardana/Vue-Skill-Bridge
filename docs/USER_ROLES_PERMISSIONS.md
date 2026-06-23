# Skill Bridge — User Roles & Permissions

---

## 1. Role Definition

| Role | Kode | Deskripsi |
|------|------|-----------|
| **Siswa SMK** | `student` | Pengguna utama — mencari magang, mengikuti tes, mendapatkan sertifikat |
| **UMKM Lokal** | `umkm` | Pemberi magang — memasang kebutuhan, menerima/menolak siswa, evaluasi |
| **Super Admin** | `superadmin` | Pengelola penuh sistem — semua akses termasuk konfigurasi algoritma |
| **Moderator** | `moderator` | Verifikasi akun UMKM, monitoring konten, laporan |
| **Support** | `support` | Layanan pengguna terbatas — reset password, bantuan teknis |

---

## 2. Hierarki Role

```
                    ┌─────────────┐
                    │ Super Admin │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────┴─────┐           ┌──────┴──────┐
         │ Moderator │           │   Support   │
         └────┬──────┘           └──────┬──────┘
              │                         │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────┴─────┐           ┌──────┴──────┐
         │  Student  │           │    UMKM     │
         └──────────┘           └─────────────┘
```

> **Catatan:** Student dan UMKM sejajar — keduanya adalah pengguna akhir. Moderator dan Support berada di bawah Super Admin.

---

## 3. Matriks Hak Akses

| Fitur / Area | Student | UMKM | Moderator | Support | Super Admin |
|-------------|:-------:|:----:|:---------:|:-------:|:-----------:|
| **Registrasi & Login** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Profil Sendiri** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Lihat Profil User Lain** | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| **Ikuti Skill Test** | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| **Lihat Hasil Tes Sendiri** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Lihat Hasil Tes Semua** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Pasang Kebutuhan Magang** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Edit Kebutuhan Magang** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Tutup Kebutuhan Magang** | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Lihat Semua Kebutuhan** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dapat Match Recommendation** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Konfirmasi / Tolak Match** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Override Match** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Lihat Status Internship** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Isi Daily Log** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Review & Rating** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Unduh Sertifikat** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Verifikasi Legalitas UMKM** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Tolak/Tunda Verifikasi UMKM** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Tambah Soal Skill Test** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Edit Soal Skill Test** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Nonaktifkan Soal** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Lihat Dashboard Statistik** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Ekspor Data Pribadi** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Ekspor Data Sistem** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Ban / Suspend User** | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| **Unban User** | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| **Konfigurasi Algoritma** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Akses Log Sistem** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Reset Password User** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Hapus Data Permanen** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Lihat Tiket Bantuan** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Balas Tiket Bantuan** | ❌ | ❌ | ❌ | ✅ | ✅ |

**Keterangan:**
- ✅ = **Full Access** — dapat melakukan aksi secara mandiri
- ⚠️ = **Limited Access** — dengan batasan tertentu (lihat detail di bawah)
- ❌ = **No Access** — tidak memiliki izin

---

## 4. Detail Batasan Akses

### 4.1 Student

| Fitur | Batasan |
|-------|---------|
| **Lihat Profil User Lain** | Hanya profil UMKM yang memiliki kebutuhan open/filled. Data kontak UMKM baru bisa diakses setelah match dikonfirmasi. |
| **Ekspor Data Pribadi** | Hanya data milik sendiri (profil, sertifikat, hasil tes, log). |

### 4.2 UMKM

| Fitur | Batasan |
|-------|---------|
| **Lihat Profil User Lain** | Hanya profil siswa yang masuk rekomendasi match. Data kontak siswa baru bisa diakses setelah match dikonfirmasi. |
| **Edit Kebutuhan Magang** | Hanya milik sendiri. Tidak bisa edit setelah status `filled`. |
| **Ekspor Data Pribadi** | Hanya data milik sendiri (profil, laporan kinerja, kebutuhan). |

### 4.3 Moderator

| Fitur | Batasan |
|-------|---------|
| **Ban / Suspend User** | Hanya temporary (maks 30 hari). Tidak bisa ban permanent. Harus disertai alasan yang tercatat di log. |
| **Unban User** | Hanya bisa unban user yang di-ban oleh dirinya sendiri. Ban dari superadmin tidak bisa di-unban moderator. |
| **Lihat Hasil Tes Semua** | Read-only, tidak bisa mengubah skor atau jawaban. |

### 4.4 Super Admin

| Fitur | Batasan |
|-------|---------|
| **Hapus Data Permanen** | Wajib melalui audit log. Semua penghapusan dicatat dengan timestamp, admin_id, dan alasan. |
| **Override Match** | Hanya dalam kasus exceptional (mismatch sistem, duplikat). Dicatat di log. |
| **Ikuti Skill Test** | Hanya mode simulasi — skor tidak masuk ke pool matchmaking. |

---

## 5. Aturan & Batasan Sistem

| Aturan | Detail | Role Terkena |
|--------|--------|--------------|
| **Anti-Spam Match** | Siswa maksimal menerima 3 rekomendasi match per hari | Student |
| **Kuota Aktif UMKM** | UMKM maksimal 5 internship aktif bersamaan | UMKM |
| **Cooling-off Period** | Siswa yang membatalkan magang < H-2 tidak dapat match baru selama 7 hari | Student |
| **Verifikasi Wajib** | UMKM belum terverifikasi tidak bisa memasang kebutuhan baru | UMKM |
| **Masa Aktif Tes** | Hasil skill test kedaluwarsa setelah 6 bulan, harus ulang | Student |
| **Satu Kali Evaluasi** | Masing-masing pihak hanya bisa evaluasi sekali per internship | Student, UMKM |
| **Masa Tenggang Verifikasi** | Moderator wajib memverifikasi/menolak UMKM dalam 3x24 jam | Moderator |

---

## 6. Permission System (Implementasi)

Permission disimpan sebagai **JSONB array of strings** di tabel `admins.permissions`.

```json
// Contoh permissions superadmin
[
  "user:read",
  "user:write",
  "user:delete",
  "user:ban",
  "user:unban",
  "student:read",
  "student:write",
  "umkm:read",
  "umkm:write",
  "umkm:verify",
  "internship:read",
  "internship:write",
  "internship:delete",
  "match:read",
  "match:write",
  "match:override",
  "question:read",
  "question:write",
  "question:delete",
  "notification:send",
  "certificate:issue",
  "certificate:revoke",
  "statistics:read",
  "statistics:export",
  "system:config",
  "system:log",
  "system:audit"
]
```

### Prefix Permission

| Prefix | Area |
|--------|------|
| `user:` | Manajemen user profil & akun |
| `student:` | Data spesifik siswa |
| `umkm:` | Data spesifik UMKM & verifikasi |
| `internship:` | Kebutuhan & jadwal magang |
| `match:` | Matchmaking & override |
| `question:` | Bank soal skill test |
| `notification:` | Kirim notifikasi |
| `certificate:` | Terbitkan & cabut sertifikat |
| `statistics:` | Dashboard & laporan |
| `system:` | Konfigurasi sistem, log, audit |
