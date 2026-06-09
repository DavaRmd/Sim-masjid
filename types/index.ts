// ========================================
// SIM Masjid — TypeScript Type Definitions
// ========================================

export type KasType = "umum" | "renovasi";
export type JenisKeuangan = "pemasukan" | "pengeluaran";
export type KategoriPengumuman = "pengumuman" | "kegiatan" | "kajian";

export interface ProfilMasjid {
  id: string;
  nama_masjid: string;
  deskripsi: string | null;
  alamat: string;
  link_maps: string | null;
  no_rekening: string | null;
  nama_bank: string | null;
  atas_nama: string | null;
  foto_url: string | null;
  qris_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  kategori: KategoriPengumuman;
  foto_url: string | null;
  video_url: string | null;
  is_aktif: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JadwalJumat {
  id: string;
  tanggal: string; // format: YYYY-MM-DD
  khatib: string | null; // null = "Segera diumumkan"
  imam: string | null;
  muadzin: string | null;
  created_at: string;
  updated_at: string;
}

export interface Keuangan {
  id: string;
  kas_type: KasType;
  jenis: JenisKeuangan;
  kategori: string;
  jumlah: number;
  keterangan: string | null;
  tanggal: string;
  is_deleted: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RingkasanKas {
  totalSeluruh: number;
  kasUmum: {
    pemasukan: number;
    pengeluaran: number;
    saldo: number;
  };
  kasRenovasi: {
    pemasukan: number;
    pengeluaran: number;
    saldo: number;
  };
}

export interface JadwalSholat {
  subuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}