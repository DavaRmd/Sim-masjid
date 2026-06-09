import { createClient } from "@/lib/supabase/server";
import KasBerjenjang from "@/components/public/KasBerjenjang";
import RenovasiTerbaru from "@/components/public/RenovasiTerbaru";
import { formatRupiah } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Keuangan, RingkasanKas } from "@/types";

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

interface KeuanganPageProps {
  searchParams?: { bulan?: string; tahun?: string };
}

export default async function KeuanganPage({ searchParams }: KeuanganPageProps) {
  const now = new Date();
  const bulanSekarang = now.getMonth() + 1;
  const tahunSekarang = now.getFullYear();

  const bulan = Math.min(12, Math.max(1, parseInt(searchParams?.bulan ?? String(bulanSekarang), 10) || bulanSekarang));
  const tahun = parseInt(searchParams?.tahun ?? String(tahunSekarang), 10) || tahunSekarang;

  const daftarTahun = Array.from({ length: 5 }, (_, i) => tahunSekarang - 2 + i);

  const supabase = await createClient();

  // 1. Semua transaksi untuk ringkasan kas keseluruhan
  const { data: semuaKeuangan } = await supabase
    .from("keuangan")
    .select("*")
    .eq("is_deleted", false);

  const ringkasanKas = hitungRingkasanKas((semuaKeuangan ?? []) as Keuangan[]);

  // 2. Transaksi bulan terpilih untuk rekap
  const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const lastDay = new Date(tahun, bulan, 0).getDate();
  const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: keuanganBulanIni } = await supabase
    .from("keuangan")
    .select("*")
    .eq("is_deleted", false)
    .gte("tanggal", startDate)
    .lte("tanggal", endDate);

  const transaksiBulanIni = (keuanganBulanIni ?? []) as Keuangan[];

  let pemasukanBulanIni = 0;
  let pengeluaranBulanIni = 0;
  for (const t of transaksiBulanIni) {
    if (t.jenis === "pemasukan") pemasukanBulanIni += t.jumlah;
    else pengeluaranBulanIni += t.jumlah;
  }

  // 3. 5 pengeluaran renovasi terbaru
  const { data: renovasiData } = await supabase
    .from("keuangan")
    .select("*")
    .eq("is_deleted", false)
    .eq("kas_type", "renovasi")
    .eq("jenis", "pengeluaran")
    .order("tanggal", { ascending: false })
    .limit(5);

  const renovasiTerbaru = (renovasiData ?? []) as Keuangan[];

  const bulanLabel = BULAN_LIST.find((b) => b.value === bulan)?.label ?? "";

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* ========== HEADER HALAMAN ========== */}
      <section className="bg-[#EAF2EB] py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            Transparansi Keuangan Masjid
          </h1>
        </div>
      </section>

      {/* ========== KAS BERJENJANG KESELURUHAN ========== */}
      <section className="bg-[#FFFAF0] py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <KasBerjenjang ringkasan={ringkasanKas} />
        </div>
      </section>

      {/* ========== FILTER BULAN & TAHUN ========== */}
      <section className="bg-white py-4">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <form className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="bulan" className="text-xs font-medium text-[#6B7280]">
                Bulan
              </label>
              <select
                id="bulan"
                name="bulan"
                defaultValue={bulan}
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
              <label htmlFor="tahun" className="text-xs font-medium text-[#6B7280]">
                Tahun
              </label>
              <select
                id="tahun"
                name="tahun"
                defaultValue={tahun}
                className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
              >
                {daftarTahun.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#346739] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230]"
            >
              Tampilkan
            </button>
          </form>
        </div>
      </section>

      {/* ========== REKAP BULAN TERPILIH ========== */}
      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
            Rekap Bulan {bulanLabel} {tahun}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Card Pemasukan */}
            <div className="rounded-xl border border-[#16A34A]/30 bg-[#F0FDF4] p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#16A34A]" />
                <span className="text-sm font-medium text-[#6B7280]">
                  Total Pemasukan
                </span>
              </div>
              <p className="mt-2 text-[28px] font-bold text-[#16A34A]">
                {formatRupiah(pemasukanBulanIni)}
              </p>
            </div>

            {/* Card Pengeluaran */}
            <div className="rounded-xl border border-[#DC2626]/30 bg-[#FEF2F2] p-6">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-[#DC2626]" />
                <span className="text-sm font-medium text-[#6B7280]">
                  Total Pengeluaran
                </span>
              </div>
              <p className="mt-2 text-[28px] font-bold text-[#DC2626]">
                {formatRupiah(pengeluaranBulanIni)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5 PENGELUARAN RENOVASI TERBARU ========== */}
      <section className="bg-[#EAF2EB] py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <RenovasiTerbaru data={renovasiTerbaru} />
        </div>
      </section>
    </div>
  );
}