"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getTanggalJumatDalamBulan } from "@/lib/jadwal-jumat-helper";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { JadwalJumat } from "@/types";

const BULAN_LIST = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

/**
 * Format tanggal Date ke "Jumat, 5 Juni 2026"
 */
function formatTanggalJumat(date: Date): string {
  return format(date, "EEEE, d MMMM yyyy", { locale: id });
}

/**
 * Format tanggal Date ke YYYY-MM-DD untuk query Supabase
 */
function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

interface JadwalFormData {
  tanggal: Date;
  khatib: string;
  imam: string;
  muadzin: string;
  /** ID dari database jika data sudah ada (untuk upsert) */
  existingId: string | null;
  /** Apakah sebelumnya ada data di DB */
  hadExistingData: boolean;
}

export default function AdminJadwalJumatPage() {
  const now = new Date();
  const bulanSekarang = now.getMonth() + 1;
  const tahunSekarang = now.getFullYear();

  const [bulan, setBulan] = useState(bulanSekarang);
  const [tahun, setTahun] = useState(tahunSekarang);
  const [jadwalForms, setJadwalForms] = useState<JadwalFormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const daftarTahun = Array.from({ length: 5 }, (_, i) => tahunSekarang - 2 + i);

  /**
   * Fetch data jadwal_jumat untuk bulan & tahun terpilih,
   * lalu merge dengan semua tanggal Jumat yang di-generate.
   */
  const fetchJadwal = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Generate semua tanggal Jumat dalam bulan
    const tanggalJumatList = getTanggalJumatDalamBulan(tahun, bulan);

    // Fetch data dari database
    const startDate = toDateString(
      tanggalJumatList[0] || new Date(tahun, bulan - 1, 1),
    );
    const endDate = toDateString(
      tanggalJumatList[tanggalJumatList.length - 1] ||
        new Date(tahun, bulan - 1, 1),
    );

    const { data: jadwalData, error } = await supabase
      .from("jadwal_jumat")
      .select("*")
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (error) {
      toast.error("Gagal memuat data jadwal", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    // Build lookup map: date string → JadwalJumat
    const jadwalMap = new Map<string, JadwalJumat>();
    if (jadwalData) {
      for (const j of jadwalData) {
        jadwalMap.set(j.tanggal, j as JadwalJumat);
      }
    }

    // Merge: untuk setiap Jumat, cari dari DB atau fallback ke kosong
    const forms: JadwalFormData[] = tanggalJumatList.map((tgl) => {
      const key = toDateString(tgl);
      const data = jadwalMap.get(key);
      return {
        tanggal: tgl,
        khatib: data?.khatib ?? "",
        imam: data?.imam ?? "",
        muadzin: data?.muadzin ?? "",
        existingId: data?.id ?? null,
        hadExistingData: !!data,
      };
    });

    setJadwalForms(forms);
    setIsLoading(false);
  }, [bulan, tahun]);

  // Fetch data setiap kali bulan/tahun berubah
  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  /**
   * Update nilai form untuk Jumat tertentu
   */
  const handleFieldChange = (
    index: number,
    field: "khatib" | "imam" | "muadzin",
    value: string,
  ) => {
    setJadwalForms((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  };

  /**
   * Simpan semua jadwal: UPSERT untuk yang ada isinya, hapus yang dikosongkan
   */
  const handleSimpan = async () => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      for (const form of jadwalForms) {
        const dateStr = toDateString(form.tanggal);
        const isEmpty =
          form.khatib.trim() === "" &&
          form.imam.trim() === "" &&
          form.muadzin.trim() === "";

        if (isEmpty) {
          // Jika semua field kosong dan sebelumnya ada data → hapus
          if (form.hadExistingData && form.existingId) {
            const { error: deleteError } = await supabase
              .from("jadwal_jumat")
              .delete()
              .eq("id", form.existingId);

            if (deleteError) {
              toast.error("Gagal menghapus jadwal", {
                description: `${formatTanggalJumat(form.tanggal)}: ${deleteError.message}`,
              });
              setIsSaving(false);
              return;
            }
          }
          // Jika semua kosong dan sebelumnya juga tidak ada data → skip
          continue;
        }

        // Ada data → UPSERT
        if (form.hadExistingData && form.existingId) {
          // Update existing
          const { error: updateError } = await supabase
            .from("jadwal_jumat")
            .update({
              khatib: form.khatib.trim() || null,
              imam: form.imam.trim() || null,
              muadzin: form.muadzin.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", form.existingId);

          if (updateError) {
            toast.error("Gagal memperbarui jadwal", {
              description: `${formatTanggalJumat(form.tanggal)}: ${updateError.message}`,
            });
            setIsSaving(false);
            return;
          }
        } else {
          // Insert new — gunakan ON CONFLICT untuk jaga-jaga race condition
          const { error: insertError } = await supabase
            .from("jadwal_jumat")
            .upsert(
              {
                tanggal: dateStr,
                khatib: form.khatib.trim() || null,
                imam: form.imam.trim() || null,
                muadzin: form.muadzin.trim() || null,
              },
              { onConflict: "tanggal" },
            );

          if (insertError) {
            toast.error("Gagal menyimpan jadwal", {
              description: `${formatTanggalJumat(form.tanggal)}: ${insertError.message}`,
            });
            setIsSaving(false);
            return;
          }
        }
      }

      toast.success("Jadwal berhasil disimpan");
      // Refresh data setelah simpan
      await fetchJadwal();
    } catch (err) {
      toast.error("Terjadi kesalahan", {
        description:
          err instanceof Error ? err.message : "Gagal menyimpan jadwal",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render card form untuk satu Jumat
   */
  const renderJumatCard = (form: JadwalFormData, index: number) => {
    return (
      <div
        key={toDateString(form.tanggal)}
        className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white"
      >
        {/* Header Card */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F9FAF9] px-4 py-3">
          <Calendar className="h-4 w-4 text-[#346739]" />
          <span className="text-sm font-semibold text-[#1A1A1A]">
            {formatTanggalJumat(form.tanggal)}
          </span>
        </div>

        {/* Form Fields */}
        <div className="grid gap-4 p-4 md:grid-cols-3">
          {/* Khatib */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`khatib-${index}`}
              className="text-xs font-medium text-[#6B7280]"
            >
              Khatib
            </label>
            <input
              id={`khatib-${index}`}
              type="text"
              value={form.khatib}
              onChange={(e) =>
                handleFieldChange(index, "khatib", e.target.value)
              }
              placeholder="Belum ditentukan"
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            />
          </div>

          {/* Imam */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`imam-${index}`}
              className="text-xs font-medium text-[#6B7280]"
            >
              Imam
            </label>
            <input
              id={`imam-${index}`}
              type="text"
              value={form.imam}
              onChange={(e) =>
                handleFieldChange(index, "imam", e.target.value)
              }
              placeholder="Belum ditentukan"
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            />
          </div>

          {/* Muadzin */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`muadzin-${index}`}
              className="text-xs font-medium text-[#6B7280]"
            >
              Muadzin
            </label>
            <input
              id={`muadzin-${index}`}
              type="text"
              value={form.muadzin}
              onChange={(e) =>
                handleFieldChange(index, "muadzin", e.target.value)
              }
              placeholder="Belum ditentukan"
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========== FILTER BULAN & TAHUN ========== */}
      <div className="rounded-xl border border-[#E5E7EB] bg-[#FFFAF0] p-4 md:p-6">
        <div className="flex flex-wrap items-end gap-3">
          {/* Bulan */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="bulan"
              className="text-xs font-medium text-[#6B7280]"
            >
              Bulan
            </label>
            <select
              id="bulan"
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            >
              {BULAN_LIST.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="tahun"
              className="text-xs font-medium text-[#6B7280]"
            >
              Tahun
            </label>
            <select
              id="tahun"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            >
              {daftarTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========== CATATAN ========== */}
      <p className="text-sm text-[#6B7280]">
        Kosongkan field yang belum ditentukan. Data kosong akan tampil sebagai
        &ldquo;Segera diumumkan&rdquo; di halaman publik.
      </p>

      {/* ========== LOADING STATE ========== */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* ========== EMPTY STATE ========== */}
      {!isLoading && jadwalForms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="mb-3 h-12 w-12 text-[#9CA3AF]" />
          <p className="text-sm text-[#6B7280]">
            Tidak ada hari Jumat di bulan ini.
          </p>
        </div>
      )}

      {/* ========== FORM DINAMIS PER JUMAT ========== */}
      {!isLoading && jadwalForms.length > 0 && (
        <div className="space-y-4">
          {jadwalForms.map((form, index) => renderJumatCard(form, index))}

          {/* ========== TOMBOL SIMPAN ========== */}
          <Button
            onClick={handleSimpan}
            disabled={isSaving}
            className="w-full bg-[#346739] hover:bg-[#2A5230] font-semibold py-6 text-base text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Simpan Jadwal
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}