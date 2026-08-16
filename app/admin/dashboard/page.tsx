import { createClient } from "@/lib/supabase/server";
import KasBerjenjang from "@/components/public/KasBerjenjang";
import { formatRupiah, formatTanggal, formatTanggalHari } from "@/lib/utils";
import Link from "next/link";
import { Megaphone, TrendingUp, TrendingDown, ArrowRight, Plus, Wallet, Calendar } from "lucide-react";
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
  umum: "bg-[#0A2E1F]/10 text-[#0A2E1F]",
  renovasi: "bg-[#D4AF37]/15 text-[#B8972E]",
};

const KAS_TYPE_LABEL: Record<string, string> = {
  umum: "Kas Umum",
  renovasi: "Kas Renovasi",
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
    <div className="space-y-8">
      {/* ========== GREETING BANNER ========== */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0A2E1F] p-6 md:p-8 text-white shadow-ambient">
        <div className="pointer-events-none absolute -right-10 -top-10 text-white/5">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="h-64 w-64">
            <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"/>
            <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
            <Calendar className="h-4 w-4" />
            <span>{today}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Selamat Datang, Pengelola!
          </h1>
          <p className="text-sm font-normal text-[#8D9F96] max-w-xl">
            Login sebagai: <span className="text-white font-medium">{userEmail}</span>. Selamat bertugas mengelola operasional dan transparansi kas masjid.
          </p>
        </div>
      </section>

      {/* ========== KAS BERJENJANG ========== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A2E1F]">Ringkasan Kas Masjid</h2>
          <Link
            href="/admin/keuangan"
            className="flex items-center gap-1 text-sm font-semibold text-[#0A2E1F] hover:text-[#D4AF37] transition-colors"
          >
            Kelola Keuangan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <KasBerjenjang ringkasan={ringkasanKas} />
      </section>

      {/* ========== SUMMARY CARDS MINI ========== */}
      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card Pengumuman Aktif */}
          <div className="rounded-xl bg-white p-5 shadow-ambient border border-[#F0EBE1] transition-smooth hover:shadow-hover">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A2E1F]/10 text-[#0A2E1F]">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">Pengumuman Aktif</p>
                <p className="text-2xl font-bold text-[#0A2E1F] mt-0.5">
                  {totalPengumumanAktif ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Card Pemasukan Bulan Ini */}
          <div className="rounded-xl bg-white p-5 shadow-ambient border border-[#F0EBE1] transition-smooth hover:shadow-hover">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">Pemasukan Bulan Ini</p>
                <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                  {formatRupiah(pemasukanBulanIni)}
                </p>
              </div>
            </div>
          </div>

          {/* Card Pengeluaran Bulan Ini */}
          <div className="rounded-xl bg-white p-5 shadow-ambient border border-[#F0EBE1] transition-smooth hover:shadow-hover">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">Pengeluaran Bulan Ini</p>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">
                  {formatRupiah(pengeluaranBulanIni)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AKSI CEPAT ========== */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-[#0A2E1F]">Aksi Cepat Admin</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pengumuman/tambah"
            className="inline-flex items-center gap-2 rounded-full bg-[#0A2E1F] px-6 py-2.5 text-sm font-semibold text-white shadow-ambient transition-all hover:bg-[#15221C] hover:shadow-hover"
          >
            <Plus className="h-4 w-4" />
            Tulis Pengumuman
          </Link>
          <Link
            href="/admin/keuangan"
            className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-white shadow-ambient transition-all hover:bg-[#b8972e] hover:shadow-hover"
          >
            <Wallet className="h-4 w-4" />
            Catat Transaksi
          </Link>
          <Link
            href="/admin/jadwal-jumat"
            className="inline-flex items-center gap-2 rounded-full border border-[#F0EBE1] bg-white px-6 py-2.5 text-sm font-semibold text-[#0A2E1F] shadow-sm transition-all hover:bg-[#F9F6F0] hover:shadow-ambient"
          >
            <ArrowRight className="h-4 w-4 text-[#8D9F96]" />
            Atur Jadwal Jumat
          </Link>
        </div>
      </section>

      {/* ========== 5 TRANSAKSI TERAKHIR ========== */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A2E1F]">Transaksi Terakhir</h2>
          <Link
            href="/admin/keuangan"
            className="flex items-center gap-1 text-sm font-semibold text-[#0A2E1F] hover:text-[#D4AF37] transition-colors"
          >
            Lihat Semua
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#F0EBE1] bg-white shadow-ambient">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0EBE1] bg-[#F9F6F0]">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                    Tanggal
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                    Keterangan
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                    Kas
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                    Jenis
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {transaksiTerakhir && transaksiTerakhir.length > 0 ? (
                  transaksiTerakhir.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${idx % 2 === 0 ? "bg-white" : "bg-[#F9F6F0]/40"} hover:bg-[#F9F6F0]`}
                    >
                      <td className="px-5 py-4 font-medium text-[#15221C]">
                        {formatTanggal(item.tanggal)}
                      </td>
                      <td className="px-5 py-4 text-[#15221C]">
                        {item.keterangan || item.kategori}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                            KAS_TYPE_BADGE[item.kas_type] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {KAS_TYPE_LABEL[item.kas_type] || item.kas_type}
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
                          item.jenis === "pemasukan" ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {formatRupiah(item.jumlah)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#8D9F96]">
                      Belum ada transaksi recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}