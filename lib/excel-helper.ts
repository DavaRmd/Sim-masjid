// lib/excel-helper.ts
// Helper untuk Import & Export Excel keuangan menggunakan SheetJS
import * as XLSX from "xlsx";
import type { Keuangan } from "@/types";

// ============================================================
// TYPES
// ============================================================

export interface ExcelRowKeuangan {
  Tanggal: string;
  Kas: string;
  Jenis: string;
  Kategori: string;
  Jumlah: number;
  Keterangan: string;
  "Nama Donatur": string;
}

export interface HasilValidasiRow {
  valid: boolean;
  pesan?: string;
}

export interface HasilImportExcel {
  berhasil: number;
  gagal: number;
  errors: { baris: number; pesan: string }[];
}

// ============================================================
// EXPORT — Data keuangan ke file .xlsx
// ============================================================

export function exportKeuanganToExcel(
  data: Keuangan[],
  namaMasjid: string,
  bulan: string,
  tahun: string
): void {
  // Ubah data ke format array untuk SheetJS
  const rows = data.map((item) => ({
    Tanggal: item.tanggal,
    Kas: item.kas_type,
    Jenis: item.jenis,
    Kategori: item.kategori,
    Jumlah: item.jumlah,
    Keterangan: item.keterangan ?? "",
    "Nama Donatur": item.nama_donatur ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Keuangan");

  // Set lebar kolom otomatis
  worksheet["!cols"] = [
    { wch: 12 }, // Tanggal
    { wch: 10 }, // Kas
    { wch: 12 }, // Jenis
    { wch: 20 }, // Kategori
    { wch: 15 }, // Jumlah
    { wch: 30 }, // Keterangan
    { wch: 20 }, // Nama Donatur
  ];

  // Nama file: Keuangan-[NamaMasjid]-[Bulan]-[Tahun].xlsx
  // Bersihkan nama file dari karakter yang tidak valid
  const namaBersih = namaMasjid.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-");
  const namaFile = `Keuangan-${namaBersih}-${bulan}-${tahun}.xlsx`;

  XLSX.writeFile(workbook, namaFile);
}

// ============================================================
// IMPORT — Parse file .xlsx ke array ExcelRowKeuangan
// ============================================================

export function parseExcelKeuangan(
  file: File
): Promise<ExcelRowKeuangan[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet) as ExcelRowKeuangan[];
        resolve(rows);
      } catch {
        reject(new Error("Gagal membaca file Excel. Pastikan format file valid."));
      }
    };

    reader.onerror = () =>
      reject(new Error("Gagal membaca file. Coba lagi."));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================
// VALIDASI — Validasi setiap baris sebelum import
// ============================================================

export function validasiRowExcel(
  row: ExcelRowKeuangan,
  nomorBaris: number
): HasilValidasiRow {
  // Validasi tanggal
  const tanggal = row["Tanggal"] ?? row.Tanggal;
  if (!tanggal || isNaN(Date.parse(String(tanggal)))) {
    return {
      valid: false,
      pesan: `Baris ${nomorBaris}: Format tanggal tidak valid (gunakan YYYY-MM-DD)`,
    };
  }

  // Validasi kas
  const kas = String(row["Kas"] ?? row.Kas ?? "").toLowerCase().trim();
  if (!["umum", "renovasi"].includes(kas)) {
    return {
      valid: false,
      pesan: `Baris ${nomorBaris}: Kolom Kas harus 'umum' atau 'renovasi'`,
    };
  }

  // Validasi jenis
  const jenis = String(row["Jenis"] ?? row.Jenis ?? "").toLowerCase().trim();
  if (!["pemasukan", "pengeluaran"].includes(jenis)) {
    return {
      valid: false,
      pesan: `Baris ${nomorBaris}: Kolom Jenis harus 'pemasukan' atau 'pengeluaran'`,
    };
  }

  // Validasi jumlah
  const jumlah = Number(row["Jumlah"] ?? row.Jumlah);
  if (!row["Jumlah"] && row["Jumlah"] !== 0 || isNaN(jumlah) || jumlah <= 0) {
    return {
      valid: false,
      pesan: `Baris ${nomorBaris}: Jumlah harus angka positif (tanpa titik/koma)`,
    };
  }

  // Validasi kategori tidak boleh kosong
  const kategori = String(row["Kategori"] ?? row.Kategori ?? "").trim();
  if (!kategori) {
    return {
      valid: false,
      pesan: `Baris ${nomorBaris}: Kategori wajib diisi`,
    };
  }

  return { valid: true };
}

// ============================================================
// GENERATE TEMPLATE — Buat file template Excel untuk didownload
// ============================================================

export function generateTemplateExcel(): void {
  const contohData = [
    {
      Tanggal: "2026-01-05",
      Kas: "umum",
      Jenis: "pemasukan",
      Kategori: "Infaq Jumat",
      Jumlah: 1250000,
      Keterangan: "Infaq jumat minggu pertama",
      "Nama Donatur": "",
    },
    {
      Tanggal: "2026-01-10",
      Kas: "renovasi",
      Jenis: "pemasukan",
      Kategori: "Donasi",
      Jumlah: 500000,
      Keterangan: "Donasi renovasi masjid",
      "Nama Donatur": "Budi Santoso",
    },
    {
      Tanggal: "2026-01-15",
      Kas: "umum",
      Jenis: "pengeluaran",
      Kategori: "Operasional",
      Jumlah: 150000,
      Keterangan: "Beli sabun dan pewangi",
      "Nama Donatur": "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(contohData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  // Set lebar kolom
  worksheet["!cols"] = [
    { wch: 14 }, // Tanggal
    { wch: 10 }, // Kas
    { wch: 14 }, // Jenis
    { wch: 20 }, // Kategori
    { wch: 15 }, // Jumlah
    { wch: 35 }, // Keterangan
    { wch: 20 }, // Nama Donatur
  ];

  XLSX.writeFile(workbook, "template-keuangan.xlsx");
}
