# SIPERIS — Sistem Informasi Perizinan Siswa Terpadu
Aplikasi Perizinan Siswa Full-Stack (React 18 + Vite + Express + Database Serverless) siap produksi, 100% Gratis Selamanya tanpa kartu kredit.

---

## 🚀 Fitur Unggulan
- **6 Hak Akses (RBAC):** Siswa, Guru Piket, Guru BK, Wali Kelas, Satpam Gerbang, Administrator TU.
- **Siklus Izin Otomatis (Workflow):**
  1. Siswa mengajukan izin (validasi otomatis: tanggal lewat, jam sekolah efektif, durasi per kategori, dan tipe lampiran).
  2. Guru Piket / BK melakukan verifikasi.
  3. Wali Kelas memberikan persetujuan (Approval) & menerbitkan Kode QR Izin satu kali pakai (*one-time token*).
  4. Satpam memindai (Scan) QR di gerbang untuk keberangkatan (*Check-Out*) dan kepulangan (*Check-In*).
  5. Sistem otomatis mendeteksi keterlambatan berdasarkan batas toleransi waktu.
- **Audit Trail Terpadu:** Seluruh perubahan status izin tercatat permanen bersama aktor dan stempel waktu.
- **Ekspor Excel (.xlsx):** Laporan dapat difilter per kelas, periode tanggal, atau status dan diunduh langsung.
- **Serverless Ready:** Kompatibel penuh dengan Vercel Serverless Functions (`/tmp/perizinan.db`) tanpa biaya sepeser pun.

---

## ⚡ Pusat Kendali Deployment Windows (1-Klik)

Gunakan file batch interaktif yang telah disediakan di root folder:

### 1. `deploy.bat` (Menu Utama Windows)
Klik 2x pada **`deploy.bat`** untuk membuka menu pusat kendali:
- **[1] Jalankan Server Lokal:** Otomatis build dan jalankan di `http://127.0.0.1:4173`.
- **[2] Jalankan Automated Test Suite:** Menjalankan 53 unit & integration test otomatis (100% lulus).
- **[3] Unggah ke GitHub & Vercel:** Menjalankan sinkronisasi 1-klik ke repository GitHub.
- **[4] Backup / Ekspor Database:** Menyimpan data terkini ke `initial_data.json`.
- **[5] Buka Online Tunnel:** Membuka URL publik Cloudflare instan tanpa konfigurasi router.

### 2. `upload_ke_github.bat` (1-Klik ke GitHub & Vercel)
- Menginisialisasi Git secara otomatis jika belum ada.
- Meminta URL repositori GitHub Anda jika belum terhubung.
- Menambahkan seluruh berkas aman (mengabaikan berkas sensitif via `.gitignore`).
- Melakukan commit otomatis dengan stempel waktu dan push ke branch `main`.
- **Setiap kali Anda menjalankan skrip ini, Vercel akan otomatis men-deploy versi terbaru!**

### 3. `online_tunnel.bat` (Online Instan via Cloudflare)
- Memberikan tautan publik aman HTTPS (contoh: `https://xxxx.trycloudflare.com`) dalam hitungan detik.
- 100% gratis selamanya tanpa login dan tanpa kartu kredit.

---

## 🌐 Panduan Deploy ke Vercel (100% Gratis Selamanya)

1. **Jalankan `upload_ke_github.bat`** untuk mengunggah proyek ke akun GitHub Anda.
2. Buka dashboard [Vercel](https://vercel.com) dan login menggunakan akun GitHub Anda.
3. Klik tombol **"Add New..."** ➜ Pilih **"Project"**.
4. Pilih repositori **`siperis`** dari daftar GitHub Anda, lalu klik **"Import"**.
5. Vercel akan otomatis membaca file `vercel.json` dan `api/index.js`:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Klik tombol **"Deploy"**.
7. Dalam waktu ~1 menit, aplikasi Anda sudah online dan dapat diakses publik dari mana saja!

---

## 🧪 Menjalankan Pengujian Otomatis (Automated Test Suite)
```bash
npm test
```
Menguji secara menyeluruh:
- Hashing kata sandi `scrypt` & perbandingan waktu-aman (*timing-safe*).
- Otentikasi dan penerbitan token untuk seluruh 6 peran.
- Validasi bisnis pengajuan izin (jam masuk/pulang, durasi, lampiran).
- Alur perizinan 6 tahap dan scan kode QR gerbang.
- Penegakan izin hak akses (RBAC) dan perlindungan akun administrator.
- Kesiapan database serverless Vercel.

---

## 👥 Akun Demo Pengujian (Kata Sandi: `1234` untuk semua akun)

| Peran | Username / NIS | Nama | Keterangan Akses |
| :--- | :--- | :--- | :--- |
| **Siswa** | `1001` / `1002` / `1003` | Ahmad / Budi / Citra | Ajukan izin, cetak kartu QR, pantau riwayat |
| **Piket** | `piket01` | Pak Piket | Verifikasi izin harian antrean piket |
| **BK** | `bk01` | Bu BK | Verifikasi konseling & deteksi histori siswa |
| **Wali Kelas** | `wali01` | Bu Wali Kelas | Approval izin kelas binaan & terbitkan QR gerbang |
| **Satpam** | `satpam01` | Pak Satpam | Scanner gerbang Check-Out / Check-In |
| **Admin** | `admin01` | Admin TU | Manajemen user, kelas, kategori, rekap Excel, pengaturan |

---

## 📁 Struktur Berkas Penting
```text
├── api/
│   └── index.js             # Serverless Function entrypoint untuk Vercel
├── server/
│   ├── index.js             # Express API Server (CORS, RBAC, Middleware)
│   ├── db.js                # Database Handler (Serverless /tmp fallback, atomic write)
│   └── seed.js              # Data seed bawaan
├── src/                     # Frontend React 18 + Tailwind CSS
├── tests/
│   └── test-suite.js        # Automated Integration & Unit Test Suite
├── vercel.json              # Konfigurasi deployment Vercel Serverless
├── initial_data.json        # Data awal aman untuk deploy serverless
├── deploy.bat               # Pusat kendali operasional Windows
├── upload_ke_github.bat     # Skrip 1-klik sync ke GitHub
├── online_tunnel.bat        # Skrip 1-klik Cloudflare Tunnel
├── .env.example             # Panduan variabel lingkungan
└── .gitignore               # Proteksi ketat berkas sensitif
```
