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
    <div>
      {/* ========== HEADER ========== */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-[#1A1A1A] md:text-2xl">
          Kelola Pengumuman
        </h1>
        <Link
          href="/admin/pengumuman/tambah"
          className="inline-flex items-center gap-2 rounded-lg bg-[#346739] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230]"
        >
          <Plus className="h-4 w-4" />
          Tulis Pengumuman
        </Link>
      </div>

      {/* ========== FILTER KATEGORI ========== */}
      <div className="mb-4 flex flex-wrap gap-2">
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

      {/* ========== TABEL ========== */}
      <div className="overflow-hidden rounded-xl border border-[#D1D5DB]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EAF2EB]">
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739] w-[60px]">
                  No
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Judul
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#346739]">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[13px] font-semibold text-[#346739] w-[100px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {pengumumanList.length > 0 ? (
                pengumumanList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#F9FAF9]"}
                  >
                    <td className="px-4 py-3 text-[#6B7280]">
                      {(halaman - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                      {item.judul}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          KATEGORI_BADGE[item.kategori] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {KATEGORI_LABEL[item.kategori] || item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {formatTanggalPendek(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.is_aktif
                            ? "bg-[#F0FDF4] text-[#16A34A]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {item.is_aktif ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/pengumuman/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-[#346739] transition-colors hover:bg-[#EAF2EB]"
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
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-[#6B7280]">
                    Belum ada pengumuman. Klik &ldquo;Tulis Pengumuman&rdquo; untuk menambahkan.
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
              className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#EAF2EB]"
            >
              ← Sebelumnya
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#9CA3AF]">
              ← Sebelumnya
            </span>
          )}

          <span className="text-sm text-[#6B7280]">
            Halaman {halaman} dari {totalHalaman}
          </span>

          {halaman < totalHalaman ? (
            <Link
              href={buildUrl(kategori, halaman + 1)}
              className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#EAF2EB]"
            >
              Berikutnya →
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#9CA3AF]">
              Berikutnya →
            </span>
          )}
        </div>
      )}
    </div>
  );
}