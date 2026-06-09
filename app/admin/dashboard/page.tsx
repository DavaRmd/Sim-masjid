import { createClient } from "@/lib/supabase/server";
import KasBerjenjang from "@/components/public/KasBerjenjang";
import { formatRupiah, formatTanggal, formatTanggalHari } from "@/lib/utils";
import Link from "next/link";
import { Megaphone, TrendingUp, TrendingDown, ArrowRight, Plus, Wallet } from "lucide-react";
import type { Keuangan, RingkasanKas } from "@/types";

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

const KAS_TYPE_BADGE: Record<string, string> = {
  umum: "bg-[#EFF6FF] text-[#2563EB]",
  renovasi: "bg-[#FFFBEB] text-[#D97706]",
};

const KAS_TYPE_LABEL: Record<string, string> = {
  umum: "Umum",
  renovasi: "Renovasi",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get user session for greeting
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "Admin";

  // Fetch all data in parallel
  const [
    { data: semuaKeuangan },
    { count: totalPengumumanAktif },
    { data: transaksiTerakhir },
  ] = await Promise.all([
    // 1. All keuangan for ringkasan kas
    supabase.from("keuangan").select("*").eq("is_deleted", false),

    // 2. Count pengumuman aktif
    supabase.from("pengumuman").select("*", { count: "exact", head: true }).eq("is_aktif", true),

    // 3. 5 transaksi terakhir
    supabase.from("keuangan").select("*").eq("is_deleted", false).order("created_at", { ascending: false }).limit(5),
  ]);

  const ringkasanKas = hitungRingkasanKas((semuaKeuangan ?? []) as Keuangan[]);

  // Hitung pemasukan & pengeluaran bulan ini
  const now = new Date();
  const startBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const endBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let pemasukanBulanIni = 0;
  let pengeluaranBulanIni = 0;

  if (semuaKeuangan) {
    for (const item of semuaKeuangan) {
      const tgl = item.tanggal;
      if (tgl >= startBulan && tgl <= endBulan) {
        if (item.jenis === "pemasukan") pemasukanBulanIni += item.jumlah;
        else pengeluaranBulanIni += item.jumlah;
      }
    }
  }

  const today = formatTanggalHari(new Date().toISOString());

  return (
    <div>
      {/* ========== GREETING ========== */}
      <section className="-mx-4 -mt-4 bg-[#FFFAF0] px-4 py-6 md:-mx-6 md:-mt-6 md:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <h1 className="text-xl font-bold text-[#1A1A1A] md:text-2xl">
          Selamat datang, {userEmail}!
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">{today}</p>
      </section>

      {/* ========== KAS BERJENJANG ========== */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Ringkasan Kas</h2>
          <Link
            href="/admin/keuangan"
            className="flex items-center gap-1 text-sm font-medium text-[#346739] hover:underline"
          >
            Kelola Keuangan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <KasBerjenjang ringkasan={ringkasanKas} />
      </section>

      {/* ========== SUMMARY CARDS ========== */}
      <section className="mt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card Pengumuman Aktif */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF]">
                <Megaphone className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Pengumuman Aktif</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {totalPengumumanAktif ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Card Pemasukan Bulan Ini */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0FDF4]">
                <TrendingUp className="h-5 w-5 text-[#16A34A]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Pemasukan Bulan Ini</p>
                <p className="text-2xl font-bold text-[#16A34A]">
                  {formatRupiah(pemasukanBulanIni)}
                </p>
              </div>
            </div>
          </div>

          {/* Card Pengeluaran Bulan Ini */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF2F2]">
                <TrendingDown className="h-5 w-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Pengeluaran Bulan Ini</p>
                <p className="text-2xl font-bold text-[#DC2626]">
                  {formatRupiah(pengeluaranBulanIni)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AKSI CEPAT ========== */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Aksi Cepat</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pengumuman/tambah"
            className="inline-flex items-center gap-2 rounded-lg bg-[#346739] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230]"
          >
            <Plus className="h-4 w-4" />
            Tulis Pengumuman
          </Link>
          <Link
            href="/admin/keuangan/tambah"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#EAF2EB]"
          >
            <Wallet className="h-4 w-4" />
            Catat Transaksi
          </Link>
          <Link
            href="/admin/jadwal-jumat"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#EAF2EB]"
          >
            <ArrowRight className="h-4 w-4" />
            Atur Jadwal Jumat
          </Link>
        </div>
      </section>

      {/* ========== 5 TRANSAKSI TERAKHIR ========== */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Transaksi Terakhir</h2>
          <Link
            href="/admin/keuangan"
            className="flex items-center gap-1 text-sm font-medium text-[#346739] hover:underline"
          >
            Lihat Semua
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#D1D5DB]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EAF2EB]">
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Keterangan
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Kas
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Jenis
                </th>
                <th className="px-4 py-3 text-right text-[13px] font-semibold text-[#346739]">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {transaksiTerakhir && transaksiTerakhir.length > 0 ? (
                transaksiTerakhir.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#F9FAF9]"}
                  >
                    <td className="px-4 py-3 text-[#1A1A1A]">
                      {formatTanggal(item.tanggal)}
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]">
                      {item.keterangan || item.kategori}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          KAS_TYPE_BADGE[item.kas_type] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {KAS_TYPE_LABEL[item.kas_type] || item.kas_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.jenis === "pemasukan"
                            ? "bg-[#F0FDF4] text-[#16A34A]"
                            : "bg-[#FEF2F2] text-[#DC2626]"
                        }`}
                      >
                        {item.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        item.jenis === "pemasukan" ? "text-[#16A34A]" : "text-[#DC2626]"
                      }`}
                    >
                      {formatRupiah(item.jumlah)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6B7280]">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}