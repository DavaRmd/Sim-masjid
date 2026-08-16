"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import KeuanganForm from "@/components/admin/KeuanganForm";
import ExcelImportPreview from "@/components/admin/ExcelImportPreview";
import type { Keuangan } from "@/types";
import { exportKeuanganToExcel } from "@/lib/excel-helper";

const BULAN_LIST = [
  { value: 0, label: "Semua" },
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

const ITEMS_PER_PAGE = 20;

export default function AdminKeuanganPage() {
  // Filter state
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [kasType, setKasType] = useState<string>("semua");
  const [jenis, setJenis] = useState<string>("semua");

  // Data state
  const [transaksiList, setTransaksiList] = useState<Keuangan[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [halaman, setHalaman] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editData, setEditData] = useState<Keuangan | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Keuangan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const daftarTahun = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const fetchTransaksi = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    // Build query
    let query = supabase
      .from("keuangan")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .order("tanggal", { ascending: false });

    // Bulan filter
    if (bulan > 0) {
      const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
      // Last day of month
      const lastDay = new Date(tahun, bulan, 0).getDate();
      const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      query = query.gte("tanggal", startDate).lte("tanggal", endDate);
    }

    // Kas type filter
    if (kasType !== "semua") {
      query = query.eq("kas_type", kasType);
    }

    // Jenis filter
    if (jenis !== "semua") {
      query = query.eq("jenis", jenis);
    }

    // Pagination
    const from = (halaman - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      toast.error("Gagal memuat data keuangan", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    setTransaksiList((data as Keuangan[]) || []);
    setTotalCount(count || 0);

    // Hitung summary — query terpisah untuk agregasi
    const summaryQuery = supabase
      .from("keuangan")
      .select("jenis, jumlah")
      .eq("is_deleted", false);

    if (bulan > 0) {
      const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
      const lastDay = new Date(tahun, bulan, 0).getDate();
      const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      summaryQuery.gte("tanggal", startDate).lte("tanggal", endDate);
    }
    if (kasType !== "semua") summaryQuery.eq("kas_type", kasType);
    if (jenis !== "semua") summaryQuery.eq("jenis", jenis);

    const { data: summaryData } = await summaryQuery;

    if (summaryData) {
      let masuk = 0;
      let keluar = 0;
      for (const item of summaryData) {
        if (item.jenis === "pemasukan") masuk += item.jumlah;
        else keluar += item.jumlah;
      }
      setTotalPemasukan(masuk);
      setTotalPengeluaran(keluar);
    }

    setIsLoading(false);
  }, [bulan, tahun, kasType, jenis, halaman]);

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  // Reset halaman ke 1 saat filter berubah
  useEffect(() => {
    setHalaman(1);
  }, [bulan, tahun, kasType, jenis]);

  const totalHalaman = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleEdit = (item: Keuangan) => {
    setEditData(item);
    setShowFormDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("keuangan")
      .update({ is_deleted: true })
      .eq("id", deleteTarget.id);

    if (error) {
      toast.error("Gagal menghapus transaksi", {
        description: error.message,
      });
    } else {
      toast.success("Transaksi berhasil dihapus");
      setDeleteTarget(null);
      fetchTransaksi();
    }

    setIsDeleting(false);
  };

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setEditData(undefined);
    fetchTransaksi();
  };

  const handleTambahClick = () => {
    setEditData(undefined);
    setShowFormDialog(true);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const supabase = createClient();

    try {
      // 1. Fetch nama masjid dari profil_masjid untuk nama file
      const { data: profilData } = await supabase
        .from("profil_masjid")
        .select("nama_masjid")
        .limit(1)
        .single();
      const namaMasjid = profilData?.nama_masjid || "Masjid";

      // 2. Build query export (tanpa range/pagination)
      let query = supabase
        .from("keuangan")
        .select("*")
        .eq("is_deleted", false)
        .order("tanggal", { ascending: false });

      // Bulan filter
      if (bulan > 0) {
        const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
        const lastDay = new Date(tahun, bulan, 0).getDate();
        const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        query = query.gte("tanggal", startDate).lte("tanggal", endDate);
      }

      // Kas type filter
      if (kasType !== "semua") {
        query = query.eq("kas_type", kasType);
      }

      // Jenis filter
      if (jenis !== "semua") {
        query = query.eq("jenis", jenis);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Gagal mengexport data", { description: error.message });
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      // 3. Panggil helper untuk export
      const bulanLabel = bulan > 0 ? BULAN_LIST[bulan].label : "Semua-Bulan";
      
      exportKeuanganToExcel(
        data as Keuangan[],
        namaMasjid,
        bulanLabel,
        String(tahun)
      );

      toast.success("Data keuangan berhasil diexport ke Excel");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Gagal mengexport data ke Excel";
      toast.error(errMsg);
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">Kas &amp; Keuangan Masjid</h2>
          <p className="text-sm text-[#8D9F96]">Kelola transaksi, catat kas umum/renovasi, serta impor-ekspor data keuangan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowImportDialog(true)}
            variant="outline"
            className="rounded-full border-[#F0EBE1] bg-white text-[#0A2E1F] hover:bg-[#F9F6F0] shadow-sm font-semibold"
          >
            <Upload className="mr-2 h-4 w-4 text-[#8D9F96]" />
            Import Excel
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            variant="outline"
            className="rounded-full border-[#F0EBE1] bg-white text-[#0A2E1F] hover:bg-[#F9F6F0] shadow-sm font-semibold"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0A2E1F]" />
            ) : (
              <FileDown className="mr-2 h-4 w-4 text-[#D4AF37]" />
            )}
            Export Excel
          </Button>
          <Button
            onClick={handleTambahClick}
            className="rounded-full bg-[#0A2E1F] hover:bg-[#15221C] text-white shadow-ambient font-bold px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Catat Transaksi
          </Button>
        </div>
      </div>

      {/* ========== SUMMARY BAR ========== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#F0EBE1] bg-white p-5 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">Total Pemasukan</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatRupiah(totalPemasukan)}
          </p>
        </div>
        <div className="rounded-xl border border-[#F0EBE1] bg-white p-5 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">Total Pengeluaran</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>
        <div className="rounded-xl bg-[#0A2E1F] p-5 text-white shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Selisih Saldo Kas</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatRupiah(totalPemasukan - totalPengeluaran)}
          </p>
        </div>
      </div>

      {/* ========== FILTER ROW ========== */}
      <div className="rounded-2xl border border-[#F0EBE1] bg-white p-5 shadow-ambient">
        <div className="flex flex-wrap items-end gap-4">
          {/* Bulan */}
          <div className="flex flex-col gap-1.5 min-w-[130px]">
            <label htmlFor="bulan" className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
              Bulan
            </label>
            <select
              id="bulan"
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="rounded-xl border border-[#F0EBE1] bg-[#F9F6F0] px-3.5 py-2 text-sm font-semibold text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            >
              {BULAN_LIST.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <label htmlFor="tahun" className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
              Tahun
            </label>
            <select
              id="tahun"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="rounded-xl border border-[#F0EBE1] bg-[#F9F6F0] px-3.5 py-2 text-sm font-semibold text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            >
              {daftarTahun.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Kas Type */}
          <div className="flex flex-col gap-1.5 min-w-[130px]">
            <label htmlFor="kasType" className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
              Kas
            </label>
            <select
              id="kasType"
              value={kasType}
              onChange={(e) => setKasType(e.target.value)}
              className="rounded-xl border border-[#F0EBE1] bg-[#F9F6F0] px-3.5 py-2 text-sm font-semibold text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            >
              <option value="semua">Semua Kas</option>
              <option value="umum">Kas Umum</option>
              <option value="renovasi">Kas Renovasi</option>
            </select>
          </div>

          {/* Jenis */}
          <div className="flex flex-col gap-1.5 min-w-[130px]">
            <label htmlFor="jenis" className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
              Jenis
            </label>
            <select
              id="jenis"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="rounded-xl border border-[#F0EBE1] bg-[#F9F6F0] px-3.5 py-2 text-sm font-semibold text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            >
              <option value="semua">Semua Jenis</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========== LOADING STATE ========== */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#0A2E1F]" />
        </div>
      )}

      {/* ========== EMPTY STATE ========== */}
      {!isLoading && transaksiList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-[#F0EBE1] bg-white p-8 shadow-ambient">
          <Wallet className="mb-3 h-12 w-12 text-[#8D9F96]/50" />
          <p className="text-base font-bold text-[#0A2E1F]">
            Belum ada transaksi keuangan
          </p>
          <p className="mt-1 text-xs text-[#8D9F96]">
            Klik &ldquo;Catat Transaksi&rdquo; di atas untuk mulai mencatat arus kas.
          </p>
        </div>
      )}

      {/* ========== TABEL TRANSAKSI ========== */}
      {!isLoading && transaksiList.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-[#F0EBE1] bg-white shadow-ambient md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0EBE1] bg-[#F9F6F0]">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Tanggal
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Kas
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Kategori
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Keterangan
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Jenis
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Jumlah
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {transaksiList.map((item, index) => {
                    const rowBg = index % 2 === 0 ? "bg-white" : "bg-[#F9F6F0]/40";
                    return (
                      <tr key={item.id} className={`transition-colors duration-150 ${rowBg} hover:bg-[#F9F6F0]`}>
                        <td className="px-5 py-4 font-medium text-[#15221C]">
                          {formatTanggal(item.tanggal)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              item.kas_type === "umum"
                                ? "bg-[#0A2E1F]/10 text-[#0A2E1F]"
                                : "bg-[#D4AF37]/15 text-[#B8972E]"
                            }`}
                          >
                            {item.kas_type === "umum" ? "Kas Umum" : "Kas Renovasi"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#15221C]">
                          {item.kategori}
                        </td>
                        <td className="max-w-[200px] px-5 py-4 text-sm text-[#8D9F96]">
                          <span className="line-clamp-2">
                            {item.keterangan || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              item.jenis === "pemasukan"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {item.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-bold ${
                            item.jenis === "pemasukan"
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {formatRupiah(item.jumlah)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="rounded-full p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="rounded-full p-2 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {transaksiList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#F0EBE1] bg-white p-5 shadow-ambient"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.kas_type === "umum"
                            ? "bg-[#0A2E1F]/10 text-[#0A2E1F]"
                            : "bg-[#D4AF37]/15 text-[#B8972E]"
                        }`}
                      >
                        {item.kas_type === "umum" ? "Kas Umum" : "Kas Renovasi"}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.jenis === "pemasukan"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </div>
                    <p className="text-base font-bold text-[#15221C]">{item.kategori}</p>
                    {item.keterangan && (
                      <p className="text-xs text-[#8D9F96] line-clamp-2">
                        {item.keterangan}
                      </p>
                    )}
                    <p className="text-xs text-[#8D9F96]">
                      {formatTanggal(item.tanggal)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <p
                      className={`text-base font-bold ${
                        item.jenis === "pemasukan"
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {formatRupiah(item.jumlah)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-full p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-full p-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ========== PAGINATION ========== */}
          {totalHalaman > 1 && (
            <div className="flex items-center justify-between rounded-full border border-[#F0EBE1] bg-white px-6 py-3 shadow-ambient">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHalaman((p) => Math.max(1, p - 1))}
                disabled={halaman === 1}
                className="rounded-full border-[#F0EBE1] text-[#15221C] hover:bg-[#F9F6F0]"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Sebelumnya
              </Button>
              <span className="text-sm font-medium text-[#8D9F96]">
                Halaman {halaman} dari {totalHalaman}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHalaman((p) => Math.min(totalHalaman, p + 1))}
                disabled={halaman === totalHalaman}
                className="rounded-full border-[#F0EBE1] text-[#15221C] hover:bg-[#F9F6F0]"
              >
                Berikutnya
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ========== DIALOG FORM TAMBAH/EDIT ========== */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-h-[90vh] max-w-[600px] overflow-y-auto rounded-2xl border border-[#F0EBE1] bg-white p-6 shadow-ambient">
          <KeuanganForm
            mode={editData ? "edit" : "tambah"}
            dataAwal={editData}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowFormDialog(false);
              setEditData(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG KONFIRMASI HAPUS ========== */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-[400px] rounded-2xl border border-[#F0EBE1] bg-white p-6 shadow-ambient">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0A2E1F]">Hapus Transaksi Keuangan</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#8D9F96]">
              Apakah Anda yakin ingin menghapus transaksi{" "}
              <strong className="text-[#0A2E1F]">&ldquo;{deleteTarget?.kategori}&rdquo;</strong> sebesar{" "}
              <strong className="text-[#0A2E1F]">{deleteTarget ? formatRupiah(deleteTarget.jumlah) : ""}</strong>?
              Data akan dihapus secara lunak (soft delete).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1 rounded-full border-[#F0EBE1] text-[#15221C] hover:bg-[#F9F6F0]"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExcelImportPreview
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={fetchTransaksi}
      />
    </div>
  );
}