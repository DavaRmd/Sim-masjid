import { createClient } from "@/lib/supabase/server";
import { getTanggalJumatDalamBulan } from "@/lib/jadwal-jumat-helper";
import { format } from "date-fns";
import { id } from "date-fns/locale";
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
 * Format tanggal Date ke kolom pendek "Jum, 5 Jun" untuk tabel
 */
function formatTanggalPendekJumat(date: Date): string {
  return format(date, "EEE, d MMM", { locale: id });
}

/**
 * Format tanggal Date ke YYYY-MM-DD untuk query Supabase
 */
function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

interface JadwalJumatPageProps {
  searchParams?: { bulan?: string; tahun?: string };
}

export default async function JadwalJumatPage({ searchParams }: JadwalJumatPageProps) {
  const now = new Date();
  const bulanSekarang = now.getMonth() + 1;
  const tahunSekarang = now.getFullYear();

  const bulan = Math.min(12, Math.max(1, parseInt(searchParams?.bulan ?? String(bulanSekarang), 10) || bulanSekarang));
  const tahun = parseInt(searchParams?.tahun ?? String(tahunSekarang), 10) || tahunSekarang;

  const daftarTahun = Array.from({ length: 5 }, (_, i) => tahunSekarang - 2 + i);

  // Generate semua tanggal Jumat dalam bulan
  const tanggalJumat = getTanggalJumatDalamBulan(tahun, bulan);

  // Fetch data jadwal dari database
  const supabase = await createClient();
  const startDate = toDateString(tanggalJumat[0] || new Date(tahun, bulan - 1, 1));
  const endDate = toDateString(tanggalJumat[tanggalJumat.length - 1] || new Date(tahun, bulan - 1, 1));

  const { data: jadwalData } = await supabase
    .from("jadwal_jumat")
    .select("*")
    .gte("tanggal", startDate)
    .lte("tanggal", endDate)
    .order("tanggal", { ascending: true });

  // Build lookup map: date string → JadwalJumat
  const jadwalMap = new Map<string, JadwalJumat>();
  if (jadwalData) {
    for (const j of jadwalData) {
      jadwalMap.set(j.tanggal, j as JadwalJumat);
    }
  }

  // Merge: untuk setiap Jumat, cari dari DB atau fallback
  const jadwalRows = tanggalJumat.map((tgl) => {
    const key = toDateString(tgl);
    const data = jadwalMap.get(key);
    return {
      tanggal: tgl,
      khatib: data?.khatib ?? null,
      imam: data?.imam ?? null,
      muadzin: data?.muadzin ?? null,
    };
  });

  const bulanLabel = BULAN_LIST.find((b) => b.value === bulan)?.label ?? "";

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* ========== HEADER HALAMAN ========== */}
      <section className="bg-[#EAF2EB] py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            Jadwal Sholat Jumat
          </h1>
        </div>
      </section>

      {/* ========== FILTER BULAN & TAHUN ========== */}
      <section className="bg-[#FFFAF0] py-4">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <form className="flex flex-wrap items-end gap-3">
            {/* Bulan */}
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

            {/* Tahun */}
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

            {/* Tombol Tampilkan */}
            <button
              type="submit"
              className="rounded-lg bg-[#346739] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230]"
            >
              Tampilkan
            </button>
          </form>
        </div>
      </section>

      {/* ========== KONTEN JADWAL ========== */}
      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">
            {bulanLabel} {tahun}
          </h2>

          {jadwalRows.length > 0 ? (
            <>
              {/* ===== DESKTOP: TABEL ===== */}
              <div className="hidden overflow-hidden rounded-xl border border-[#D1D5DB] md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#EAF2EB]">
                      <th className="px-4 py-3 text-left font-semibold text-[#1A1A1A]">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1A1A1A]">
                        Khatib
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1A1A1A]">
                        Imam
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-[#1A1A1A]">
                        Muadzin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1D5DB]">
                    {jadwalRows.map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-[#FFFAF0] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                          {formatTanggalPendekJumat(row.tanggal)}
                        </td>
                        <td className="px-4 py-3">
                          {row.khatib ?? (
                            <span className="italic text-[#6B7280]">Segera diumumkan</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.imam ?? (
                            <span className="italic text-[#6B7280]">Segera diumumkan</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.muadzin ?? (
                            <span className="italic text-[#6B7280]">Segera diumumkan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===== MOBILE: CARD PER JUMAT ===== */}
              <div className="flex flex-col gap-3 md:hidden">
                {jadwalRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#D1D5DB] bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-[#346739]">
                      📅 {formatTanggalJumat(row.tanggal)}
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Khatib</span>
                        <span className="font-medium text-[#1A1A1A]">
                          {row.khatib ?? (
                            <span className="italic text-[#6B7280]">Segera diumumkan</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Imam</span>
                        <span className="font-medium text-[#1A1A1A]">
                          {row.imam ?? (
                            <span className="italic text-[#6B7280]">Segera diumumkan</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Muadzin</span>
                        <span className="font-medium text-[#1A1A1A]">
                          {row.muadzin ?? (
                            <span className="italic text-[#6B7280]">Segera diumumkan</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-[#6B7280]">
                Jadwal belum tersedia untuk bulan ini
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}