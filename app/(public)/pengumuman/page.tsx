import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import PengumumanCard from "@/components/public/PengumumanCard";
import type { Pengumuman } from "@/types";

const KATEGORI_LIST = ["semua", "pengumuman", "kegiatan", "kajian"] as const;
type Kategori = (typeof KATEGORI_LIST)[number];
const ITEMS_PER_PAGE = 9;

function KategoriLabel(k: Kategori): string {
  const map: Record<Kategori, string> = {
    semua: "Semua",
    pengumuman: "Pengumuman",
    kegiatan: "Kegiatan",
    kajian: "Kajian",
  };
  return map[k];
}

function buildUrl(kategori: Kategori, halaman: number): string {
  const params = new URLSearchParams();
  if (kategori !== "semua") params.set("kategori", kategori);
  if (halaman > 1) params.set("halaman", String(halaman));
  const qs = params.toString();
  return qs ? `/pengumuman?${qs}` : "/pengumuman";
}

export default async function PengumumanPage({
  searchParams,
}: {
  searchParams?: { kategori?: string; halaman?: string };
}) {
  const kategori =
    searchParams?.kategori && KATEGORI_LIST.includes(searchParams.kategori as Kategori)
      ? (searchParams.kategori as Kategori)
      : "semua";
  const halaman = Math.max(1, parseInt(searchParams?.halaman ?? "1", 10) || 1);

  const supabase = await createClient();

  // Count total for pagination
  let countQuery = supabase
    .from("pengumuman")
    .select("*", { count: "exact", head: true })
    .eq("is_aktif", true);

  if (kategori !== "semua") {
    countQuery = countQuery.eq("kategori", kategori);
  }

  const { count: totalItems } = await countQuery;
  const totalHalaman = Math.max(1, Math.ceil((totalItems ?? 0) / ITEMS_PER_PAGE));

  // Fetch page of announcements
  const from = (halaman - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let dataQuery = supabase
    .from("pengumuman")
    .select("*")
    .eq("is_aktif", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (kategori !== "semua") {
    dataQuery = dataQuery.eq("kategori", kategori);
  }

  const { data } = await dataQuery;
  const pengumumanList: Pengumuman[] = data ?? [];

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* ========== HEADER HALAMAN ========== */}
      <section className="bg-[#EAF2EB] py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            Pengumuman & Kegiatan
          </h1>
        </div>
      </section>

      {/* ========== FILTER KATEGORI ========== */}
      <section className="bg-[#FFFAF0] py-4">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {KATEGORI_LIST.map((k) => (
              <Link
                key={k}
                href={buildUrl(k, 1)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  kategori === k
                    ? "bg-[#346739] text-white"
                    : "border border-[#D1D5DB] bg-white text-[#1A1A1A] hover:bg-[#EAF2EB]"
                }`}
              >
                {KategoriLabel(k)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== GRID PENGUMUMAN ========== */}
      <section className="py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          {pengumumanList.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pengumumanList.map((p) => (
                <PengumumanCard key={p.id} pengumuman={p} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-[#6B7280]">
                Tidak ada pengumuman untuk kategori ini
              </p>
            </div>
          )}

          {/* ========== PAGINATION ========== */}
          {totalHalaman > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              {halaman > 1 ? (
                <Link
                  href={buildUrl(kategori, halaman - 1)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#EAF2EB] transition-colors"
                >
                  ← Sebelumnya
                </Link>
              ) : (
                <span className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#9CA3AF] cursor-not-allowed">
                  ← Sebelumnya
                </span>
              )}

              <span className="text-sm text-[#6B7280]">
                Halaman {halaman} dari {totalHalaman}
              </span>

              {halaman < totalHalaman ? (
                <Link
                  href={buildUrl(kategori, halaman + 1)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:bg-[#EAF2EB] transition-colors"
                >
                  Berikutnya →
                </Link>
              ) : (
                <span className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#9CA3AF] cursor-not-allowed">
                  Berikutnya →
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}