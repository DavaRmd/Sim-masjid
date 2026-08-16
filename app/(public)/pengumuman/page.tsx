import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Megaphone, BookOpen, Calendar } from "lucide-react";
import { formatTanggalPendek } from "@/lib/utils";
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

const KATEGORI_ICON: Record<string, React.FC<{ className?: string }>> = {
  pengumuman: Megaphone,
  kegiatan: Calendar,
  kajian: BookOpen,
};

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

  let countQuery = supabase
    .from("pengumuman")
    .select("*", { count: "exact", head: true })
    .eq("is_aktif", true);
  if (kategori !== "semua") countQuery = countQuery.eq("kategori", kategori);

  const { count: totalItems } = await countQuery;
  const totalHalaman = Math.max(1, Math.ceil((totalItems ?? 0) / ITEMS_PER_PAGE));

  const from = (halaman - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let dataQuery = supabase
    .from("pengumuman")
    .select("*")
    .eq("is_aktif", true)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (kategori !== "semua") dataQuery = dataQuery.eq("kategori", kategori);

  const { data } = await dataQuery;
  const pengumumanList: Pengumuman[] = data ?? [];

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[960px] px-4 py-8 md:px-6 lg:px-8">

        {/* ========== PAGE TITLE ========== */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-[280px] flex-col gap-3">
            <h1 className="text-primary text-4xl font-black leading-tight tracking-[-0.033em]">
              Pengumuman &amp; Kegiatan
            </h1>
            <p className="text-muted text-base font-normal leading-normal">
              Informasi terbaru seputar jadwal kajian, kegiatan sosial, dan pengumuman masjid.
            </p>
          </div>
        </div>

        {/* ========== FILTER PILLS ========== */}
        <div className="flex gap-3 p-3 flex-wrap pr-4 mb-4">
          {KATEGORI_LIST.map((k) => (
            <Link
              key={k}
              href={buildUrl(k, 1)}
              className={`transition-smooth flex h-10 shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold shadow-sm ${
                kategori === k
                  ? "bg-primary text-white shadow-ambient"
                  : "border border-muted/20 bg-white text-muted hover:text-primary hover:shadow-ambient"
              }`}
            >
              {KategoriLabel(k)}
            </Link>
          ))}
        </div>

        {/* ========== ARTICLE GRID ========== */}
        {pengumumanList.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 p-4">
            {pengumumanList.map((p) => {
              const IconComponent = KATEGORI_ICON[p.kategori] || Megaphone;
              return (
                <Link
                  key={p.id}
                  href={`/pengumuman/${p.id}`}
                  className="group flex flex-col gap-4 bg-white p-3 pb-4 rounded-lg shadow-ambient hover:shadow-hover transition-smooth cursor-pointer"
                >
                  {/* Foto / Placeholder — aspect-video */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-md bg-[#F9F6F0]">
                    {p.foto_url ? (
                      <Image
                        src={p.foto_url}
                        alt={p.judul}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <IconComponent className="h-10 w-10 text-muted/40" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-2">
                    {/* Tanggal gold uppercase */}
                    <p className="text-accent text-xs font-bold uppercase tracking-wider mb-1">
                      {formatTanggalPendek(p.created_at)}
                    </p>

                    {/* Judul — hover jadi gold */}
                    <h2 className="text-primary group-hover:text-accent transition-smooth text-lg font-bold leading-tight mb-2 line-clamp-2">
                      {p.judul}
                    </h2>

                    {/* Isi singkat */}
                    <p className="text-muted text-sm font-normal leading-relaxed line-clamp-2">
                      {p.isi}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#F0EBE1] bg-white py-16 text-center shadow-ambient mx-4">
            <p className="text-sm text-muted">Belum ada informasi untuk kategori ini</p>
          </div>
        )}

        {/* ========== PAGINATION ========== */}
        {totalHalaman > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            {halaman > 1 ? (
              <Link
                href={buildUrl(kategori, halaman - 1)}
                className="rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#15221C] shadow-ambient transition-all hover:border-[#0A2E1F] hover:text-[#0A2E1F]"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <span className="rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#8D9F96] cursor-not-allowed">
                ← Sebelumnya
              </span>
            )}
            <span className="text-sm text-[#8D9F96]">{halaman} / {totalHalaman}</span>
            {halaman < totalHalaman ? (
              <Link
                href={buildUrl(kategori, halaman + 1)}
                className="rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#15221C] shadow-ambient transition-all hover:border-[#0A2E1F] hover:text-[#0A2E1F]"
              >
                Berikutnya →
              </Link>
            ) : (
              <span className="rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#8D9F96] cursor-not-allowed">
                Berikutnya →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
