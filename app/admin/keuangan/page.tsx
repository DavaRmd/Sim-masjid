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
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Kas & Keuangan Masjid</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            variant="outline"
            className="w-full border-[#346739] text-[#346739] hover:bg-[#EAF2EB] sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>
          <Button
            onClick={handleTambahClick}
            className="w-full bg-[#346739] hover:bg-[#2A5230] text-white sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Catat Transaksi
          </Button>
        </div>
      </div>

      {/* ========== SUMMARY BAR ========== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#D1D5DB] bg-[#F0FDF4] p-4">
          <p className="text-xs font-medium text-[#6B7280]">Total Pemasukan</p>
          <p className="mt-1 text-lg font-bold text-[#16A34A]">
            {formatRupiah(totalPemasukan)}
          </p>
        </div>
        <div className="rounded-xl border border-[#D1D5DB] bg-[#FEF2F2] p-4">
          <p className="text-xs font-medium text-[#6B7280]">Total Pengeluaran</p>
          <p className="mt-1 text-lg font-bold text-[#DC2626]">
            {formatRupiah(totalPengeluaran)}
          </p>
        </div>
        <div className="rounded-xl border border-[#D1D5DB] bg-[#EAF2EB] p-4">
          <p className="text-xs font-medium text-[#6B7280]">Saldo</p>
          <p className="mt-1 text-lg font-bold text-[#346739]">
            {formatRupiah(totalPemasukan - totalPengeluaran)}
          </p>
        </div>
      </div>

      {/* ========== FILTER ROW ========== */}
      <div className="rounded-xl border border-[#E5E7EB] bg-[#FFFAF0] p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Bulan */}
          <div className="flex flex-col gap-1">
            <label htmlFor="bulan" className="text-xs font-medium text-[#6B7280]">
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
            <label htmlFor="tahun" className="text-xs font-medium text-[#6B7280]">
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

          {/* Kas Type */}
          <div className="flex flex-col gap-1">
            <label htmlFor="kasType" className="text-xs font-medium text-[#6B7280]">
              Kas
            </label>
            <select
              id="kasType"
              value={kasType}
              onChange={(e) => setKasType(e.target.value)}
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            >
              <option value="semua">Semua</option>
              <option value="umum">Kas Umum</option>
              <option value="renovasi">Kas Renovasi</option>
            </select>
          </div>

          {/* Jenis */}
          <div className="flex flex-col gap-1">
            <label htmlFor="jenis" className="text-xs font-medium text-[#6B7280]">
              Jenis
            </label>
            <select
              id="jenis"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
            >
              <option value="semua">Semua</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
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
          <Wallet className="mb-3 h-12 w-12 text-[#9CA3AF]" />
          <p className="text-sm font-medium text-[#6B7280]">
            Belum ada transaksi keuangan
          </p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Klik &ldquo;Catat Transaksi&rdquo; untuk menambahkan
          </p>
        </div>
      )}

      {/* ========== TABEL TRANSAKSI ========== */}
      {!isLoading && transaksiList.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAF9]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">
                    Kas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">
                    Keterangan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">
                    Jenis
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#6B7280]">
                    Jumlah
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaksiList.map((item, index) => {
                  const rowBg = index % 2 === 0 ? "bg-white" : "bg-[#F9FAF9]";
                  return (
                    <tr key={item.id} className={`border-b border-[#E5E7EB] ${rowBg}`}>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                        {formatTanggal(item.tanggal)}
                      </td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                        {item.kategori}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-sm text-[#6B7280]">
                        <span className="line-clamp-2">
                          {item.keterangan || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.jenis === "pemasukan"
                              ? "bg-[#F0FDF4] text-[#16A34A]"
                              : "bg-[#FEF2F2] text-[#DC2626]"
                          }`}
                        >
                          {item.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${
                          item.jenis === "pemasukan"
                            ? "text-[#16A34A]"
                            : "text-[#DC2626]"
                        }`}
                      >
                        {formatRupiah(item.jumlah)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#346739]"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
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

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {transaksiList.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#E5E7EB] bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.kas_type === "umum"
                            ? "bg-[#EFF6FF] text-[#2563EB]"
                            : "bg-[#FFF7ED] text-[#C2410C]"
                        }`}
                      >
                        {item.kas_type === "umum" ? "Umum" : "Renovasi"}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.jenis === "pemasukan"
                            ? "bg-[#F0FDF4] text-[#16A34A]"
                            : "bg-[#FEF2F2] text-[#DC2626]"
                        }`}
                      >
                        {item.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280]">{item.kategori}</p>
                    {item.keterangan && (
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">
                        {item.keterangan}
                      </p>
                    )}
                    <p className="text-xs text-[#9CA3AF]">
                      {formatTanggal(item.tanggal)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p
                      className={`text-sm font-bold ${
                        item.jenis === "pemasukan"
                          ? "text-[#16A34A]"
                          : "text-[#DC2626]"
                      }`}
                    >
                      {formatRupiah(item.jumlah)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#346739]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
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
            <div className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHalaman((p) => Math.max(1, p - 1))}
                disabled={halaman === 1}
                className="text-sm"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Sebelumnya
              </Button>
              <span className="text-sm text-[#6B7280]">
                Halaman {halaman} dari {totalHalaman}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHalaman((p) => Math.min(totalHalaman, p + 1))}
                disabled={halaman === totalHalaman}
                className="text-sm"
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
        <DialogContent className="max-h-[90vh] max-w-[600px] overflow-y-auto rounded-xl">
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
        <DialogContent className="max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Hapus Transaksi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus transaksi{" "}
              <strong>&ldquo;{deleteTarget?.kategori}&rdquo;</strong> sebesar{" "}
              <strong>{deleteTarget ? formatRupiah(deleteTarget.jumlah) : ""}</strong>?
              Data akan dihapus secara lunak (soft delete) dan tidak muncul di
              daftar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
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
    </div>
  );
}