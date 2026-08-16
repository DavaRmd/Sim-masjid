import { createClient } from "@/lib/supabase/server";
import { getTanggalJumatDalamBulan } from "@/lib/jadwal-jumat-helper";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { JadwalJumat } from "@/types";
import UnduhPDFButton from "@/components/public/UnduhPDFButton";

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

function formatTanggalPanjang(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: id });
}

function formatHijri(date: Date): string {
  try {
    return new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function buildNavUrl(bulan: number, tahun: number): string {
  return `/jadwal-jumat?bulan=${bulan}&tahun=${tahun}`;
}

interface JadwalJumatPageProps {
  searchParams?: { bulan?: string; tahun?: string };
}

export const dynamic = "force-dynamic";

export default async function JadwalJumatPage({ searchParams }: JadwalJumatPageProps) {
  const now = new Date();
  const bulanSekarang = now.getMonth() + 1;
  const tahunSekarang = now.getFullYear();

  const bulan = Math.min(12, Math.max(1, parseInt(searchParams?.bulan ?? String(bulanSekarang), 10) || bulanSekarang));
  const tahun = parseInt(searchParams?.tahun ?? String(tahunSekarang), 10) || tahunSekarang;

  // Prev/next month navigation
  const prevBulan = bulan === 1 ? 12 : bulan - 1;
  const prevTahun = bulan === 1 ? tahun - 1 : tahun;
  const nextBulan = bulan === 12 ? 1 : bulan + 1;
  const nextTahun = bulan === 12 ? tahun + 1 : tahun;

  const tanggalJumat = getTanggalJumatDalamBulan(tahun, bulan);
  const supabase = await createClient();

  const startDate = toDateString(tanggalJumat[0] || new Date(tahun, bulan - 1, 1));
  const endDate = toDateString(tanggalJumat[tanggalJumat.length - 1] || new Date(tahun, bulan - 1, 1));

  const { data: jadwalData } = await supabase
    .from("jadwal_jumat")
    .select("*")
    .gte("tanggal", startDate)
    .lte("tanggal", endDate)
    .order("tanggal", { ascending: true });

  const jadwalMap = new Map<string, JadwalJumat>();
  if (jadwalData) {
    for (const j of jadwalData) {
      jadwalMap.set(j.tanggal, j as JadwalJumat);
    }
  }

  // Find the next/current Friday
  const nextFridayDate = (() => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7;
    d.setDate(d.getDate() + diff);
    return toDateString(d);
  })();

  const jadwalRows = tanggalJumat.map((tgl) => {
    const key = toDateString(tgl);
    const data = jadwalMap.get(key);
    return {
      tanggal: tgl,
      dateKey: key,
      khatib: data?.khatib ?? null,
      imam: data?.imam ?? null,
      muadzin: data?.muadzin ?? null,
      isThisWeek: key === nextFridayDate,
    };
  });

  const bulanLabel = BULAN_LIST.find((b) => b.value === bulan)?.label ?? "";

  // Hijri for current displayed month
  const hijriLabel = formatHijri(new Date(tahun, bulan - 1, 15));

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[960px] px-4 py-8 md:px-6 lg:px-8">

        {/* ========== PAGE HEADER ========== */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0A2E1F] md:text-[40px]">
              Jadwal Jumat
            </h1>
            <p className="mt-2 flex items-center gap-2 text-base font-medium text-[#8D9F96]">
              <Calendar className="h-5 w-5 text-[#8D9F96]" />
              {hijriLabel} / {bulanLabel} {tahun}
            </p>
          </div>

          {/* Month navigation pills */}
          <div className="flex gap-3">
            <Link
              href={buildNavUrl(prevBulan, prevTahun)}
              className="flex items-center gap-2 bg-white text-[#15221C] px-4 py-2 rounded-full text-sm font-semibold shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
              Bulan Sebelumnya
            </Link>
            <Link
              href={buildNavUrl(nextBulan, nextTahun)}
              className="flex items-center gap-2 bg-white text-[#15221C] px-4 py-2 rounded-full text-sm font-semibold shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              Bulan Depan
              <ChevronRight className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        {/* ========== SCHEDULE CARD ========== */}
        {jadwalRows.length > 0 ? (
          <div className="overflow-hidden rounded-lg bg-white shadow-ambient">
            {/* Table header — hidden on mobile */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 border-b border-[#F0EBE1] bg-gray-50 px-6 py-4">
              <div className="col-span-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Tanggal
              </div>
              <div className="col-span-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Khatib
              </div>
              <div className="col-span-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Imam
              </div>
            </div>

            {/* Rows */}
            <div className="flex flex-col divide-y divide-[#F0EBE1]">
              {jadwalRows.map((row, idx) => (
                <div
                  key={idx}
                  className={`group relative overflow-hidden flex flex-col gap-2 px-6 py-5 border-l-4 transition-all duration-300 ease-smooth sm:grid sm:grid-cols-12 sm:gap-4 ${
                    row.isThisWeek
                      ? "border-l-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 border-b border-gray-50"
                      : "border-l-transparent hover:bg-[#F9F6F0]"
                  }`}
                >
                  {/* Decorative mosque icon on highlighted row */}
                  {row.isThisWeek && (
                    <div className="pointer-events-none absolute right-4 top-4 text-[#D4AF37]/20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12">
                        <path d="M12 2C10.34 2 9 3.34 9 5v1H4l-1 3h18l-1-3h-5V5c0-1.66-1.34-3-3-3zm-8 6v14h16V8H4zm7 2h2v10h-2V10z"/>
                      </svg>
                    </div>
                  )}

                  {/* Tanggal */}
                  <div className="col-span-4 flex flex-col justify-center relative z-10">
                    <span className={`sm:hidden text-[10px] font-bold uppercase mb-1 ${row.isThisWeek ? 'text-[#D4AF37]' : 'text-[#8D9F96]'}`}>
                      {row.isThisWeek ? "Hari Ini" : "Tanggal"}
                    </span>
                    <div className={`text-base ${row.isThisWeek ? "font-bold text-[#0A2E1F]" : "font-semibold text-[#15221C]"}`}>
                      {formatTanggalPanjang(row.tanggal)}
                    </div>
                    <div className={`text-sm mt-0.5 ${row.isThisWeek ? "text-[#D4AF37] font-medium" : "text-[#8D9F96]"}`}>
                      {formatHijri(row.tanggal)}
                    </div>
                    {row.isThisWeek && (
                      <span className="hidden sm:inline-block mt-2 w-max rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        HARI INI
                      </span>
                    )}
                  </div>

                  {/* Khatib */}
                  <div className="col-span-4 flex flex-col justify-center relative z-10 mt-2 sm:mt-0">
                    <span className="sm:hidden text-[#8D9F96] text-[10px] font-bold uppercase">Khatib</span>
                    <div className={`text-lg flex items-center gap-2 ${row.isThisWeek ? "font-bold text-[#15221C]" : "font-semibold text-base text-[#15221C]"}`}>
                      {row.khatib ?? (
                        <span className="text-sm italic font-normal text-[#8D9F96]">Segera diumumkan</span>
                      )}
                    </div>
                  </div>

                  {/* Imam */}
                  <div className="col-span-4 flex flex-col justify-center relative z-10 mt-2 sm:mt-0">
                    <span className="sm:hidden text-[#8D9F96] text-[10px] font-bold uppercase">Imam</span>
                    <div className={`font-medium ${row.isThisWeek ? "text-base text-[#8D9F96]" : "text-sm text-[#8D9F96]"}`}>
                      {row.imam ?? (
                        <span className="text-sm italic font-normal text-[#8D9F96]">Segera diumumkan</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#F0EBE1] bg-white py-16 text-center shadow-ambient">
            <p className="text-sm text-[#8D9F96]">Jadwal belum tersedia untuk bulan ini</p>
          </div>
        )}

        {/* ========== FOOTER NOTE & ACTION ========== */}
        <div className="mt-6 flex justify-between items-center text-sm text-[#8D9F96]">
          <p>* Jadwal dapat berubah sewaktu-waktu</p>
          <UnduhPDFButton />
        </div>

      </div>
    </div>
  );
}

