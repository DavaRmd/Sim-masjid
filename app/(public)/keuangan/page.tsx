import { createClient } from "@/lib/supabase/server";
import KasBerjenjang from "@/components/public/KasBerjenjang";
import RenovasiTerbaru from "@/components/public/RenovasiTerbaru";
import DaftarDonatur from "@/components/public/DaftarDonatur";
import KeuanganChart from "@/components/public/KeuanganChart";
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

  // 2. Transaksi bulan terpilih untuk rekap + chart
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

  // 3. Transaksi terbaru bulan ini untuk ledger (max 10)
  const transaksiTerbaru = transaksiBulanIni
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 10);

  // 4. Pengeluaran renovasi terbaru
  const { data: renovasiData } = await supabase
    .from("keuangan")
    .select("*")
    .eq("is_deleted", false)
    .eq("kas_type", "renovasi")
    .eq("jenis", "pengeluaran")
    .order("tanggal", { ascending: false })
    .limit(5);

  const renovasiTerbaru = (renovasiData ?? []) as Keuangan[];

  // 5. Donatur renovasi
  const { data: donaturData } = await supabase
    .from("keuangan")
    .select("nama_donatur, jumlah, tanggal")
    .eq("is_deleted", false)
    .eq("kas_type", "renovasi")
    .eq("jenis", "pemasukan")
    .order("tanggal", { ascending: false });

  const donaturRenovasi = (donaturData ?? []) as {
    nama_donatur: string | null;
    jumlah: number;
    tanggal: string;
  }[];

  const bulanLabel = BULAN_LIST.find((b) => b.value === bulan)?.label ?? "";

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">

      {/* ========== HEADER ========== */}
      <section className="bg-[#0A2E1F] py-10 md:py-14">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Transparansi Keuangan Masjid
          </h1>
          <p className="mt-1 text-sm text-[#8D9F96]">
            Laporan keuangan terbuka untuk seluruh jamaah
          </p>
        </div>
      </section>

      {/* ========== RINGKASAN KAS KESELURUHAN ========== */}
      <section className="bg-[#F9F6F0] py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <KasBerjenjang ringkasan={ringkasanKas} />
        </div>
      </section>

      {/* ========== REKAP BULANAN + DONUT CHART ========== */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          {/* Filter Bulan & Tahun */}
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0A2E1F]">
                Rekap Bulan {bulanLabel} {tahun}
              </h2>
              <p className="mt-0.5 text-sm text-[#8D9F96]">
                Ringkasan pemasukan dan pengeluaran bulan ini
              </p>
            </div>
            <form className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="bulan" className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">
                  Bulan
                </label>
                <select
                  id="bulan"
                  name="bulan"
                  defaultValue={bulan}
                  className="rounded-lg border border-[#F0EBE1] bg-white px-3 py-2 text-sm text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  {BULAN_LIST.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="tahun" className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">
                  Tahun
                </label>
                <select
                  id="tahun"
                  name="tahun"
                  defaultValue={tahun}
                  className="rounded-lg border border-[#F0EBE1] bg-white px-3 py-2 text-sm text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                >
                  {daftarTahun.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="ripple rounded-full bg-[#0A2E1F] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#15221C]"
              >
                Tampilkan
              </button>
            </form>
          </div>

          {/* 2-column: Chart + Summary cards + Ledger */}
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">

            {/* KIRI: Donut Chart + Summary Cards */}
            <div className="flex flex-col gap-6 lg:w-[40%]">
              {/* Donut Chart */}
              <div className="rounded-lg border border-[#F0EBE1] bg-white p-6 shadow-ambient">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#8D9F96]">
                  Komposisi Kas Bulan Ini
                </h3>
                <KeuanganChart
                  pemasukan={pemasukanBulanIni}
                  pengeluaran={pengeluaranBulanIni}
                />
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#F0EBE1] bg-white p-4 shadow-ambient">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0A2E1F]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">
                      Pemasukan
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-[#0A2E1F]">
                    {formatRupiah(pemasukanBulanIni)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#F0EBE1] bg-white p-4 shadow-ambient">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-[#8D9F96]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">
                      Pengeluaran
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-[#15221C]">
                    {formatRupiah(pengeluaranBulanIni)}
                  </p>
                </div>
              </div>
            </div>

            {/* KANAN: Ledger Transaksi Terbaru */}
            <div className="lg:w-[60%]">
              <div className="rounded-lg border border-[#F0EBE1] bg-white shadow-ambient">
                <div className="border-b border-[#F0EBE1] px-6 py-4">
                  <h3 className="font-bold text-[#0A2E1F]">
                    Transaksi Terbaru
                  </h3>
                  <p className="mt-0.5 text-xs text-[#8D9F96]">
                    {bulanLabel} {tahun}
                  </p>
                </div>

                {transaksiTerbaru.length > 0 ? (
                  <div className="divide-y divide-[#F0EBE1]">
                    {transaksiTerbaru.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex h-16 items-center justify-between px-6"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              t.jenis === "pemasukan"
                                ? "bg-[#0A2E1F]/5"
                                : "bg-[#F0EBE1]"
                            }`}
                          >
                            {t.jenis === "pemasukan" ? (
                              <TrendingUp className="h-3.5 w-3.5 text-[#0A2E1F]" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 text-[#8D9F96]" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#15221C] line-clamp-1">
                              {t.keterangan || (t.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran")}
                            </p>
                            <p className="text-xs text-[#8D9F96]">{t.tanggal}</p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            t.jenis === "pemasukan"
                              ? "text-[#0A2E1F]"
                              : "text-[#8D9F96]"
                          }`}
                        >
                          {t.jenis === "pemasukan" ? "+" : "-"}{formatRupiah(t.jumlah)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[#8D9F96]">
                      Belum ada transaksi bulan ini
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PENGELUARAN RENOVASI TERBARU ========== */}
      <section className="bg-[#F9F6F0] py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <RenovasiTerbaru data={renovasiTerbaru} />
        </div>
      </section>

      {/* ========== DAFTAR DONATUR RENOVASI ========== */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <DaftarDonatur data={donaturRenovasi} />
        </div>
      </section>
    </div>
  );
}
