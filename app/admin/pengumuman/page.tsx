import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { formatTanggalPendek } from "@/lib/utils";
import PengumumanDeleteButton from "@/components/admin/PengumumanDeleteButton";
import type { Pengumuman } from "@/types";

const KATEGORI_LIST = ["semua", "pengumuman", "kegiatan", "kajian"] as const;
type Kategori = (typeof KATEGORI_LIST)[number];

const KATEGORI_LABEL: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  kajian: "Kajian",
};

const KATEGORI_BADGE: Record<string, string> = {
  pengumuman: "bg-[#EAF2EB] text-[#346739]",
  kegiatan: "bg-[#EFF6FF] text-[#2563EB]",
  kajian: "bg-[#FFF7ED] text-[#C2410C]",
};

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
  return qs ? `/admin/pengumuman?${qs}` : "/admin/pengumuman";
}

const ITEMS_PER_PAGE = 10;

interface AdminPengumumanPageProps {
  searchParams?: { kategori?: string; halaman?: string };
}

export default async function AdminPengumumanPage({
  searchParams,
}: AdminPengumumanPageProps) {
  const kategori =
    searchParams?.kategori && KATEGORI_LIST.includes(searchParams.kategori as Kategori)
      ? (searchParams.kategori as Kategori)
      : "semua";
  const halaman = Math.max(1, parseInt(searchParams?.halaman ?? "1", 10) || 1);

  const supabase = await createClient();

  // Count total
  let countQuery = supabase
    .from("pengumuman")
    .select("*", { count: "exact", head: true });

  if (kategori !== "semua") {
    countQuery = countQuery.eq("kategori", kategori);
  }

  const { count: totalItems } = await countQuery;
  const totalHalaman = Math.max(1, Math.ceil((totalItems ?? 0) / ITEMS_PER_PAGE));

  // Fetch page
  const from = (halaman - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let dataQuery = supabase
    .from("pengumuman")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (kategori !== "semua") {
    dataQuery = dataQuery.eq("kategori", kategori);
  }

  const { data } = await dataQuery;
  const pengumumanList: Pengumuman[] = data ?? [];

  return (
    <div className="space-y-8">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">
            Kelola Pengumuman &amp; Kegiatan
          </h1>
          <p className="mt-1 text-sm text-[#8D9F96]">
            Publikasikan kabar terbaru, agenda kajian, dan informasi penting jamaah.
          </p>
        </div>
        <Link
          href="/admin/pengumuman/tambah"
          className="inline-flex items-center gap-2 rounded-full bg-[#0A2E1F] px-6 py-2.5 text-sm font-bold text-white shadow-ambient transition-all hover:bg-[#15221C] hover:shadow-hover"
        >
          <Plus className="h-4 w-4" />
          Tulis Pengumuman
        </Link>
      </div>

      {/* ========== FILTER KATEGORI ========== */}
      <div className="flex flex-wrap gap-2.5">
        {KATEGORI_LIST.map((k) => (
          <Link
            key={k}
            href={buildUrl(k, 1)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-200 shadow-sm ${
              kategori === k
                ? "bg-[#0A2E1F] text-white shadow-ambient"
                : "border border-[#F0EBE1] bg-white text-[#8D9F96] hover:text-[#0A2E1F] hover:shadow-ambient"
            }`}
          >
            {KategoriLabel(k)}
          </Link>
        ))}
      </div>

      {/* ========== TABEL ========== */}
      <div className="overflow-hidden rounded-xl border border-[#F0EBE1] bg-white shadow-ambient">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0EBE1] bg-[#F9F6F0]">
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[60px]">
                  No
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Judul Informasi
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Kategori
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Tanggal Dibuat
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Status
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[120px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {pengumumanList.length > 0 ? (
                pengumumanList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-150 ${idx % 2 === 0 ? "bg-white" : "bg-[#F9F6F0]/40"} hover:bg-[#F9F6F0]`}
                  >
                    <td className="px-5 py-4 font-medium text-[#8D9F96]">
                      {(halaman - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#15221C]">
                      {item.judul}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          item.kategori === "pengumuman"
                            ? "bg-[#0A2E1F]/10 text-[#0A2E1F]"
                            : item.kategori === "kegiatan"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {KATEGORI_LABEL[item.kategori] || item.kategori}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#8D9F96]">
                      {formatTanggalPendek(item.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          item.is_aktif
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.is_aktif ? "Aktif (Tampil)" : "Draft (Sembunyi)"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/pengumuman/${item.id}`}
                          className="rounded-full p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                          title="Edit pengumuman"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <PengumumanDeleteButton pengumuman={item} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm font-medium text-[#8D9F96]">
                    Belum ada pengumuman untuk kategori ini. Klik &ldquo;Tulis Pengumuman&rdquo; untuk membuat baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== PAGINATION ========== */}
      {totalHalaman > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          {halaman > 1 ? (
            <Link
              href={buildUrl(kategori, halaman - 1)}
              className="rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#15221C] shadow-ambient transition-all hover:border-[#0A2E1F] hover:text-[#0A2E1F]"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#8D9F96]">
              ← Sebelumnya
            </span>
          )}

          <span className="text-sm font-medium text-[#8D9F96]">
            Halaman {halaman} dari {totalHalaman}
          </span>

          {halaman < totalHalaman ? (
            <Link
              href={buildUrl(kategori, halaman + 1)}
              className="rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#15221C] shadow-ambient transition-all hover:border-[#0A2E1F] hover:text-[#0A2E1F]"
            >
              Berikutnya →
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-full border border-[#F0EBE1] bg-white px-5 py-2 text-sm font-semibold text-[#8D9F96]">
              Berikutnya →
            </span>
          )}
        </div>
      )}
    </div>
  );
}