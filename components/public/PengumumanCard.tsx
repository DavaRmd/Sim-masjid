import Link from "next/link";
import Image from "next/image";
import { Calendar, Megaphone, BookOpen } from "lucide-react";
import { formatTanggalPendek } from "@/lib/utils";
import type { Pengumuman } from "@/types";

interface PengumumanCardProps {
  pengumuman: Pengumuman;
}

const KATEGORI_ICON: Record<string, React.FC<{ className?: string }>> = {
  pengumuman: Megaphone,
  kegiatan: Calendar,
  kajian: BookOpen,
};

const KATEGORI_BADGE: Record<string, string> = {
  pengumuman: "bg-[#EAF2EB] text-[#346739]",
  kegiatan: "bg-[#EFF6FF] text-[#2563EB]",
  kajian: "bg-[#FFF7ED] text-[#C2410C]",
};

const KATEGORI_LABEL: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  kajian: "Kajian",
};

export default function PengumumanCard({ pengumuman }: PengumumanCardProps) {
  const IconComponent = KATEGORI_ICON[pengumuman.kategori] || Megaphone;

  return (
    <Link
      href={`/pengumuman/${pengumuman.id}`}
      className="group block overflow-hidden rounded-xl border border-[#D1D5DB] bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Foto atau Placeholder */}
      {pengumuman.foto_url ? (
        <div className="relative h-[180px] w-full">
          <Image
            src={pengumuman.foto_url}
            alt={pengumuman.judul}
            fill
            className="object-cover rounded-t-xl"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex h-[180px] items-center justify-center rounded-t-xl bg-[#EAF2EB]">
          <IconComponent className="h-10 w-10 text-[#346739]" />
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        {/* Badge */}
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            KATEGORI_BADGE[pengumuman.kategori] || "bg-[#EAF2EB] text-[#346739]"
          }`}
        >
          {KATEGORI_LABEL[pengumuman.kategori] || pengumuman.kategori}
        </span>

        {/* Judul */}
        <h3 className="mt-2 line-clamp-2 text-base font-semibold text-[#1A1A1A]">
          {pengumuman.judul}
        </h3>

        {/* Isi singkat */}
        <p className="mt-1 line-clamp-3 text-sm text-[#6B7280]">
          {pengumuman.isi}
        </p>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatTanggalPendek(pengumuman.created_at)}</span>
          </div>
          <span className="text-sm font-medium text-[#346739] group-hover:underline">
            Lihat Detail →
          </span>
        </div>
      </div>
    </Link>
  );
}