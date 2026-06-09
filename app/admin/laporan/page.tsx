"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Printer, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Keuangan, ProfilMasjid, RingkasanKas } from "@/types";

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

function formatTanggal(tanggal: string): string {
  return format(new Date(tanggal), "d MMM yyyy", { locale: id });
}

function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

function hitungRingkasanKas(data: Keuangan[]): RingkasanKas {
  let kasUmumPemasukan = 0;
  let kasUmumPengeluaran = 0;
  let kasRenovasiPemasukan = 0;
  let kasRenovasiPengeluaran = 0;

  for (const item of data) {
    if (item.kas_type === "umum") {
      if (item.jenis === "pemasukan") kasUmumPemasukan += item.jumlah;
      else kasUmumPengeluaran += item.jumlah;
    } else if (item.kas_type === "renovasi") {
      if (item.jenis === "pemasukan") kasRenovasiPemasukan += item.jumlah;
      else kasRenovasiPengeluaran += item.jumlah;
    }
  }

  const saldoUmum = kasUmumPemasukan - kasUmumPengeluaran;
  const saldoRenovasi = kasRenovasiPemasukan - kasRenovasiPengeluaran;

  return {
    totalSeluruh: saldoUmum + saldoRenovasi,
    kasUmum: {
      pemasukan: kasUmumPemasukan,
      pengeluaran: kasUmumPengeluaran,
      saldo: saldoUmum,
    },
    kasRenovasi: {
      pemasukan: kasRenovasiPemasukan,
      pengeluaran: kasRenovasiPengeluaran,
      saldo: saldoRenovasi,
    },
  };
}

export default function AdminLaporanPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [profilMasjid, setProfilMasjid] = useState<ProfilMasjid | null>(null);
  const [transaksiList, setTransaksiList] = useState<Keuangan[]>([]);
  const [ringkasanKas, setRingkasanKas] = useState<RingkasanKas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tanggalCetak, setTanggalCetak] = useState("");

  const daftarTahun = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Fetch profil masjid (for print header)
    const { data: profilData } = await supabase
      .from("profil_masjid")
      .select("*")
      .limit(1)
      .single();

    if (profilData) {
      setProfilMasjid(profilData as ProfilMasjid);
    }

    // Fetch keuangan for selected month
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const lastDay = new Date(tahun, bulan, 0).getDate();
    const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data: keuanganData, error } = await supabase
      .from("keuangan")
      .select("*")
      .eq("is_deleted", false)
      .gte("tanggal", startDate)
      .lte("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (error) {
      toast.error("Gagal memuat data laporan", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    const list = (keuanganData as Keuangan[]) || [];
    setTransaksiList(list);
    setRingkasanKas(hitungRingkasanKas(list));
    setIsLoading(false);
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCetak = () => {
    const sekarang = new Date();
    setTanggalCetak(
      format(sekarang, "d MMMM yyyy", { locale: id }) +
        " pukul " +
        sekarang.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
    );
    setTimeout(() => window.print(), 50);
  };

  const namaBulan = BULAN_LIST.find((b) => b.value === bulan)?.label ?? "";

  return (
    <div className="space-y-6">
      {/* ========== HEADER + BUTTON CETAK (screen only) ========== */}
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Laporan Keuangan</h2>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Cetak laporan keuangan bulanan untuk arsip atau dokumentasi
          </p>
        </div>
        <Button
          onClick={handleCetak}
          disabled={isLoading || transaksiList.length === 0}
          className="w-full bg-[#346739] hover:bg-[#2A5230] text-white sm:w-auto"
        >
          <Printer className="mr-2 h-4 w-4" />
          Cetak Laporan
        </Button>
      </div>

      {/* ========== FILTER (screen only) ========== */}
      <div className="rounded-xl border border-[#E5E7EB] bg-[#FFFAF0] p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="laporan-bulan"
              className="text-xs font-medium text-[#6B7280]"
            >
              Bulan
            </label>
            <select
              id="laporan-bulan"
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

          <div className="flex flex-col gap-1">
            <label
              htmlFor="laporan-tahun"
              className="text-xs font-medium text-[#6B7280]"
            >
              Tahun
            </label>
            <select
              id="laporan-tahun"
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

      {/* ========== LOADING STATE ========== */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* ========== EMPTY STATE ========== */}
      {!isLoading && transaksiList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="mb-3 h-12 w-12 text-[#9CA3AF]" />
          <p className="text-sm font-medium text-[#6B7280]">
            Tidak ada transaksi di {namaBulan} {tahun}
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Pilih bulan lain atau tambahkan transaksi di halaman Keuangan
          </p>
        </div>
      )}

      {/* ========== PREVIEW / PRINT AREA ========== */}
      {!isLoading && transaksiList.length > 0 && ringkasanKas && (
        <div className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm md:p-8">
          {/* ===== PRINT HEADER (hidden on screen, visible on print) ===== */}
          <div className="mb-6 hidden text-center print:block">
            <h1 className="text-xl font-bold text-[#1A1A1A]">
              LAPORAN KEUANGAN MASJID
            </h1>
            <h2 className="mt-1 text-lg font-semibold text-[#346739]">
              {profilMasjid?.nama_masjid ?? "Nama Masjid"}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Periode: {namaBulan} {tahun}
            </p>
            <p className="text-sm text-[#6B7280]">
              Dicetak: {tanggalCetak || format(new Date(), "d MMMM yyyy", { locale: id })}
            </p>
            <hr className="mt-4 border-[#D1D5DB]" />
          </div>

          {/* ===== SCREEN PREVIEW HEADER ===== */}
          <div className="mb-6 print:hidden">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              {profilMasjid?.nama_masjid ?? "Nama Masjid"}
            </h3>
            <p className="text-sm text-[#6B7280]">
              Laporan Keuangan — {namaBulan} {tahun}
            </p>
          </div>

          {/* ===== RINGKASAN KAS ===== */}
          <div className="mb-6">
            <h3 className="mb-3 text-base font-semibold text-[#1A1A1A]">
              RINGKASAN KAS
            </h3>
            <div className="space-y-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAF9] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Total Kas Seluruh Masjid</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {formatRupiah(ringkasanKas.totalSeluruh)}
                </span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-[#6B7280]">└ Kas Umum</span>
                <span className="font-medium text-[#2563EB]">
                  {formatRupiah(ringkasanKas.kasUmum.saldo)}
                </span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-[#6B7280]">└ Kas Renovasi</span>
                <span className="font-medium text-[#D97706]">
                  {formatRupiah(ringkasanKas.kasRenovasi.saldo)}
                </span>
              </div>
            </div>
          </div>

          {/* ===== KAS UMUM ===== */}
          <div className="mb-6">
            <h3 className="mb-3 text-base font-semibold text-[#2563EB]">
              KAS UMUM
            </h3>
            <div className="space-y-1.5 rounded-lg border border-[#E5E7EB] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Pemasukan</span>
                <span className="font-medium text-[#16A34A]">
                  {formatRupiah(ringkasanKas.kasUmum.pemasukan)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Pengeluaran</span>
                <span className="font-medium text-[#DC2626]">
                  {formatRupiah(ringkasanKas.kasUmum.pengeluaran)}
                </span>
              </div>
              <hr className="border-[#E5E7EB]" />
              <div className="flex justify-between">
                <span className="font-semibold text-[#1A1A1A]">
                  Saldo Kas Umum
                </span>
                <span className="font-semibold text-[#2563EB]">
                  {formatRupiah(ringkasanKas.kasUmum.saldo)}
                </span>
              </div>
            </div>
          </div>

          {/* ===== KAS RENOVASI ===== */}
          <div className="mb-6">
            <h3 className="mb-3 text-base font-semibold text-[#D97706]">
              KAS RENOVASI
            </h3>
            <div className="space-y-1.5 rounded-lg border border-[#E5E7EB] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Pemasukan</span>
                <span className="font-medium text-[#16A34A]">
                  {formatRupiah(ringkasanKas.kasRenovasi.pemasukan)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Pengeluaran</span>
                <span className="font-medium text-[#DC2626]">
                  {formatRupiah(ringkasanKas.kasRenovasi.pengeluaran)}
                </span>
              </div>
              <hr className="border-[#E5E7EB]" />
              <div className="flex justify-between">
                <span className="font-semibold text-[#1A1A1A]">
                  Saldo Kas Renovasi
                </span>
                <span className="font-semibold text-[#D97706]">
                  {formatRupiah(ringkasanKas.kasRenovasi.saldo)}
                </span>
              </div>
            </div>
          </div>

          {/* ===== DETAIL TRANSAKSI ===== */}
          <div>
            <h3 className="mb-3 text-base font-semibold text-[#1A1A1A]">
              DETAIL TRANSAKSI
            </h3>
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAF9]">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">
                      Tanggal
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">
                      Kas
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">
                      Kategori
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">
                      Keterangan
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">
                      Jenis
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#6B7280]">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiList.map((item, index) => {
                    const rowBg =
                      index % 2 === 0 ? "bg-white" : "bg-[#F9FAF9]";
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-[#E5E7EB] ${rowBg} print:break-inside-avoid`}
                      >
                        <td className="px-3 py-2.5 text-[#1A1A1A]">
                          {formatTanggal(item.tanggal)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.kas_type === "umum"
                                ? "bg-[#EFF6FF] text-[#2563EB]"
                                : "bg-[#FFF7ED] text-[#C2410C]"
                            }`}
                          >
                            {item.kas_type === "umum" ? "Umum" : "Renovasi"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[#1A1A1A]">
                          {item.kategori}
                        </td>
                        <td className="max-w-[200px] px-3 py-2.5 text-[#6B7280]">
                          <span className="line-clamp-2">
                            {item.keterangan || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.jenis === "pemasukan"
                                ? "bg-[#F0FDF4] text-[#16A34A]"
                                : "bg-[#FEF2F2] text-[#DC2626]"
                            }`}
                          >
                            {item.jenis === "pemasukan"
                              ? "Pemasukan"
                              : "Pengeluaran"}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-semibold ${
                            item.jenis === "pemasukan"
                              ? "text-[#16A34A]"
                              : "text-[#DC2626]"
                          }`}
                        >
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== PRINT FOOTER (hidden on screen, visible on print) ===== */}
          <div className="mt-8 hidden text-center text-sm text-[#9CA3AF] print:block">
            <p>Laporan ini dicetak melalui SIM Masjid</p>
            <p>
              Dicetak pada{" "}
              {tanggalCetak ||
                format(new Date(), "d MMMM yyyy", { locale: id })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}