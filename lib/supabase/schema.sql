-- ============================================
-- SIM Masjid — Database Migration v2.0
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  nama        VARCHAR(255) NOT NULL,
  role        VARCHAR(50) DEFAULT 'admin',
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel profil_masjid (insert 1 baris default)
CREATE TABLE profil_masjid (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_masjid   VARCHAR(255) NOT NULL DEFAULT 'Nama Masjid',
  deskripsi     TEXT,
  alamat        TEXT NOT NULL DEFAULT 'Alamat Masjid',
  link_maps     VARCHAR(500),
  no_rekening   VARCHAR(100),
  nama_bank     VARCHAR(100),
  atas_nama     VARCHAR(255),
  no_whatsapp   VARCHAR(20),
  foto_url      VARCHAR(500),
  qris_url      VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Insert data awal profil masjid (wajib ada 1 baris)
INSERT INTO profil_masjid (nama_masjid, alamat)
VALUES ('Nama Masjid Anda', 'Alamat Masjid Anda');

-- 3. Tabel pengumuman
CREATE TABLE pengumuman (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul         VARCHAR(255) NOT NULL,
  isi           TEXT NOT NULL,
  kategori      VARCHAR(50) NOT NULL,
  foto_url      VARCHAR(500),
  video_url     VARCHAR(500),
  is_aktif      BOOLEAN DEFAULT TRUE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 4. Tabel jadwal_jumat
CREATE TABLE jadwal_jumat (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal     DATE NOT NULL UNIQUE,
  khatib      VARCHAR(255),
  imam        VARCHAR(255),
  muadzin     VARCHAR(255),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 5. Tabel keuangan
CREATE TABLE keuangan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kas_type      VARCHAR(50) NOT NULL DEFAULT 'umum',
  jenis         VARCHAR(20) NOT NULL,
  kategori      VARCHAR(100) NOT NULL,
  jumlah        BIGINT NOT NULL,
  keterangan    TEXT,
  tanggal       DATE NOT NULL,
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Pengumuman
ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik bisa baca pengumuman aktif" ON pengumuman
  FOR SELECT USING (is_aktif = TRUE);
CREATE POLICY "Admin bisa kelola pengumuman" ON pengumuman
  FOR ALL USING (auth.role() = 'authenticated');

-- Jadwal Jumat
ALTER TABLE jadwal_jumat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik bisa baca jadwal jumat" ON jadwal_jumat
  FOR SELECT TO public USING (TRUE);
CREATE POLICY "Admin bisa kelola jadwal jumat" ON jadwal_jumat
  FOR ALL USING (auth.role() = 'authenticated');

-- Keuangan
ALTER TABLE keuangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hanya admin yang bisa akses keuangan" ON keuangan
  FOR ALL USING (auth.role() = 'authenticated');

-- Profil Masjid
ALTER TABLE profil_masjid ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik bisa baca profil masjid" ON profil_masjid
  FOR SELECT TO public USING (TRUE);
CREATE POLICY "Admin bisa update profil masjid" ON profil_masjid
  FOR UPDATE USING (auth.role() = 'authenticated');