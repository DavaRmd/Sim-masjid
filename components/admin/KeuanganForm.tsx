"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Keuangan, KasType, JenisKeuangan } from "@/types";

const KATEGORI_PEMASUKAN = ["Infaq Jumat", "Donasi", "Zakat", "Lainnya"];
const KATEGORI_PENGELUARAN = [
  "Listrik",
  "Kebersihan",
  "Renovasi",
  "Konsumsi",
  "Operasional",
  "Lainnya",
];

interface KeuanganFormProps {
  mode: "tambah" | "edit";
  dataAwal?: Keuangan;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Format angka ke string Rupiah tanpa prefix "Rp"
 * Contoh: 1500000 → "1.500.000"
 */
function formatAngkaKeRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID").format(angka);
}

/**
 * Parse string Rupiah (dengan titik) ke number
 * Contoh: "1.500.000" → 1500000
 */
function parseRupiahKeAngka(teks: string): number {
  const cleaned = teks.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

/**
 * Format tanggal ke YYYY-MM-DD untuk input date
 */
function formatTanggalInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function KeuanganForm({
  mode,
  dataAwal,
  onSuccess,
  onCancel,
}: KeuanganFormProps) {
  const [kasType, setKasType] = useState<KasType>(
    dataAwal?.kas_type || "umum",
  );
  const [jenis, setJenis] = useState<JenisKeuangan>(
    dataAwal?.jenis || "pemasukan",
  );
  const [kategori, setKategori] = useState(dataAwal?.kategori || "");
  const [jumlahDisplay, setJumlahDisplay] = useState(
    dataAwal ? formatAngkaKeRupiah(dataAwal.jumlah) : "",
  );
  const [jumlah, setJumlah] = useState(dataAwal?.jumlah || 0);
  const [tanggal, setTanggal] = useState(
    dataAwal?.tanggal || formatTanggalInput(new Date()),
  );
  const [keterangan, setKeterangan] = useState(dataAwal?.keterangan || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset kategori saat jenis berubah (kecuali saat edit dengan data existing)
  useEffect(() => {
    if (mode === "tambah") {
      setKategori("");
    }
  }, [jenis, mode]);

  const kategoriOptions =
    jenis === "pemasukan" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Hanya izinkan angka dan titik
    const filtered = raw.replace(/[^0-9.]/g, "");
    // Hapus titik yang sudah ada, lalu format ulang
    const numValue = parseRupiahKeAngka(filtered);
    setJumlah(numValue);
    setJumlahDisplay(numValue > 0 ? formatAngkaKeRupiah(numValue) : "");
    // Clear error
    if (errors.jumlah) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.jumlah;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!kategori) {
      newErrors.kategori = "Kategori wajib dipilih";
    }

    if (jumlah <= 0) {
      newErrors.jumlah = "Jumlah harus lebih dari Rp 0";
    }

    if (!tanggal) {
      newErrors.tanggal = "Tanggal wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      if (mode === "tambah") {
        const { error } = await supabase.from("keuangan").insert({
          kas_type: kasType,
          jenis,
          kategori,
          jumlah,
          keterangan: keterangan.trim() || null,
          tanggal,
        });

        if (error) {
          toast.error("Gagal mencatat transaksi", {
            description: error.message,
          });
          setIsSubmitting(false);
          return;
        }

        toast.success("Transaksi berhasil dicatat");
      } else {
        // Edit mode
        if (!dataAwal) {
          toast.error("Data tidak ditemukan");
          setIsSubmitting(false);
          return;
        }

        const { error } = await supabase
          .from("keuangan")
          .update({
            kas_type: kasType,
            jenis,
            kategori,
            jumlah,
            keterangan: keterangan.trim() || null,
            tanggal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dataAwal.id);

        if (error) {
          toast.error("Gagal memperbarui transaksi", {
            description: error.message,
          });
          setIsSubmitting(false);
          return;
        }

        toast.success("Transaksi berhasil diperbarui");
      }

      onSuccess();
    } catch (err) {
      toast.error("Terjadi kesalahan", {
        description:
          err instanceof Error ? err.message : "Gagal menyimpan transaksi",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = formatTanggalInput(new Date());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dialog Header */}
      <div className="border-b border-[#E5E7EB] pb-4">
        <h3 className="text-lg font-bold text-[#1A1A1A]">
          {mode === "tambah" ? "Catat Transaksi Baru" : "Edit Transaksi"}
        </h3>
      </div>

      {/* ========== PILIHAN KAS ========== */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A1A1A]">
          Jenis Kas
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setKasType("umum")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              kasType === "umum"
                ? "border-[#346739] bg-[#EAF2EB]"
                : "border-[#D1D5DB] bg-white hover:border-[#346739]/50"
            }`}
          >
            <span className="text-2xl">💼</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">
              Kas Umum
            </span>
          </button>
          <button
            type="button"
            onClick={() => setKasType("renovasi")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              kasType === "renovasi"
                ? "border-[#346739] bg-[#EAF2EB]"
                : "border-[#D1D5DB] bg-white hover:border-[#346739]/50"
            }`}
          >
            <span className="text-2xl">🏗️</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">
              Kas Renovasi
            </span>
          </button>
        </div>
      </div>

      {/* ========== PILIHAN JENIS ========== */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A1A1A]">
          Jenis Transaksi
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setJenis("pemasukan")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              jenis === "pemasukan"
                ? "border-[#16A34A] bg-[#F0FDF4]"
                : "border-[#D1D5DB] bg-white hover:border-[#16A34A]/50"
            }`}
          >
            <span className="text-2xl">↑</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">
              Pemasukan
            </span>
          </button>
          <button
            type="button"
            onClick={() => setJenis("pengeluaran")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
              jenis === "pengeluaran"
                ? "border-[#DC2626] bg-[#FEF2F2]"
                : "border-[#D1D5DB] bg-white hover:border-[#DC2626]/50"
            }`}
          >
            <span className="text-2xl">↓</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">
              Pengeluaran
            </span>
          </button>
        </div>
      </div>

      {/* ========== KATEGORI ========== */}
      <div className="space-y-1.5">
        <label
          htmlFor="kategori"
          className="text-sm font-semibold text-[#1A1A1A]"
        >
          Kategori <span className="text-[#DC2626]">*</span>
        </label>
        <select
          id="kategori"
          value={kategori}
          onChange={(e) => {
            setKategori(e.target.value);
            if (errors.kategori) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.kategori;
                return next;
              });
            }
          }}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-2 focus:ring-[#346739]/20 ${
            errors.kategori ? "border-[#DC2626] ring-2 ring-[#DC2626]/20" : "border-[#D1D5DB]"
          }`}
        >
          <option value="">Pilih kategori</option>
          {kategoriOptions.map((kat) => (
            <option key={kat} value={kat}>
              {kat}
            </option>
          ))}
        </select>
        {errors.kategori && (
          <p className="text-xs text-[#DC2626]">{errors.kategori}</p>
        )}
      </div>

      {/* ========== JUMLAH ========== */}
      <div className="space-y-1.5">
        <label
          htmlFor="jumlah"
          className="text-sm font-semibold text-[#1A1A1A]"
        >
          Jumlah <span className="text-[#DC2626]">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
            Rp
          </span>
          <input
            id="jumlah"
            type="text"
            inputMode="numeric"
            value={jumlahDisplay}
            onChange={handleJumlahChange}
            placeholder="0"
            className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-2 focus:ring-[#346739]/20 ${
              errors.jumlah ? "border-[#DC2626] ring-2 ring-[#DC2626]/20" : "border-[#D1D5DB]"
            }`}
          />
        </div>
        {errors.jumlah && (
          <p className="text-xs text-[#DC2626]">{errors.jumlah}</p>
        )}
      </div>

      {/* ========== TANGGAL ========== */}
      <div className="space-y-1.5">
        <label
          htmlFor="tanggal"
          className="text-sm font-semibold text-[#1A1A1A]"
        >
          Tanggal <span className="text-[#DC2626]">*</span>
        </label>
        <input
          id="tanggal"
          type="date"
          value={tanggal}
          onChange={(e) => {
            setTanggal(e.target.value);
            if (errors.tanggal) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.tanggal;
                return next;
              });
            }
          }}
          max={todayStr}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-2 focus:ring-[#346739]/20 ${
            errors.tanggal ? "border-[#DC2626] ring-2 ring-[#DC2626]/20" : "border-[#D1D5DB]"
          }`}
        />
        {errors.tanggal && (
          <p className="text-xs text-[#DC2626]">{errors.tanggal}</p>
        )}
      </div>

      {/* ========== KETERANGAN ========== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="keterangan"
            className="text-sm font-semibold text-[#1A1A1A]"
          >
            Keterangan
          </label>
          <span className="text-xs text-[#9CA3AF]">
            {keterangan.length}/500
          </span>
        </div>
        <textarea
          id="keterangan"
          value={keterangan}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setKeterangan(e.target.value);
            }
          }}
          placeholder="Opsional: deskripsi transaksi"
          rows={3}
          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-2 focus:ring-[#346739]/20 resize-y min-h-[80px]"
        />
      </div>

      {/* ========== TOMBOL ========== */}
      <div className="flex gap-3 border-t border-[#E5E7EB] pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-[#346739] hover:bg-[#2A5230] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "tambah" ? "Simpan" : "Perbarui"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}