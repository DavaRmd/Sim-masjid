# 🕌 SIM Masjid — Sistem Informasi & Manajemen Kas Masjid Modern

**SIM Masjid** adalah platform aplikasi web manajemen masjid modern yang dirancang untuk meningkatkan transparansi keuangan, memudahkan publikasi kegiatan jam'iyyah/jamaah, serta menyederhanakan pengelolaan operasional pengurus DKM (Dewan Kemakmuran Masjid).

Aplikasi ini mengusung tema desain **"Divine Minimalist"** dengan perpaduan warna Islami nan elegan (*Deep Forest Green*, *Warm Cream*, dan *Muted Gold*).

---

## ✨ Fitur-Fitur Utama

### 🌐 1. Halaman Publik (Jamaah)
- **Dashboard Beranda**: Banner utama masjid, widget jadwal sholat otomatis, serta countdown waktu sholat berikutnya.
- **Transparansi Keuangan 3 Lapis**: Laporan kas terpisah (*Kas Utama, Kas Anak Yatim, dan Kas Pembangunan*) dilengkapi dengan **Grafik Interaktif (Recharts)** dan riwayat transaksi.
- **Pengumuman & Kegiatan**: Informasi kajian, pengumuman, dan kegiatan masjid lengkap dengan pemutar video embedded.
- **Jadwal Petugas Jumat**: Informasi Khatib, Imam, dan Muadzin per Jumat, dilengkapi tombol **Unduh PDF Resmi** otomatis.
- **Profil & Kepengurusan DKM**: Susunan struktur organisasi pengurus masjid beserta kontak WhatsApp.
- **Donasi Digital**: Tampilan gambar QRIS dan nomor rekening donasi bank masjid.

### 🔐 2. Panel Admin Command Center (Pengurus DKM)
- **Dashboard Ringkasan**: Statistik pengumuman aktif, total saldo kas, dan tabel 5 transaksi terbaru.
- **Kelola Keuangan & Import Excel**: Manajemen data transaksi kas serta **Fitur Import Batch dari File Excel (.xlsx)** dengan modal pratinjau & validasi data 3 langkah.
- **Kelola Pengumuman**: Editor pengumuman lengkap dengan uploader foto banner dropzone dan opsi publikasi.
- **Kelola Jadwal Jumat**: Form pengisian petugas Jumat bulanan secara batch.
- **Kelola Kepengurusan DKM**: Manajemen data anggota DKM, jabatan, serta foto profil avatar.
- **Kelola Profil & Galeri Foto**: Pengaturan data masjid, gambar QRIS, serta Galeri Foto Kegiatan yang dilengkapi **Kompresi Gambar Otomatis Canvas API (< 500KB)**.

---

## 🛠️ Teknologi (Tech Stack)

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & Storage)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Komponen UI**: Lucide React Icons, Shadcn UI / Base UI, Sonner Toast
- **Visualisasi Data**: [Recharts](https://recharts.org/)
- **Pengolahan Excel**: [SheetJS (xlsx)](https://sheetjs.com/)

---

## 🚀 Cara Menjalankan di Lokal

### 1. Clone Repositori
```bash
git clone https://github.com/DavaRmd/Sim-masjid.git
cd Sim-masjid
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local` di root proyek dan isi dengan konfigurasi Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Jalankan Server Dev
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📄 Lisensi

Proyek ini dikembangkan untuk kemaslahatan pengelolaan masjid. Silakan digunakan dan dikembangkan lebih lanjut.
