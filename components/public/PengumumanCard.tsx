import Link from "next/link";
import Image from "next/image";
import { Calendar, Megaphone, BookOpen } from "lucide-react";
import { formatTanggalPendek } from "@/lib/utils";
import type { Pengumuman } from "@/types";

interface PengumumanCardProps {
  pengumuman: Pengumuman;
}

const KATEGORI_LABEL: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  kajian: "Kajian",
};

const KATEGORI_ICON: Record<string, React.FC<{ className?: string }>> = {
  pengumuman: Megaphone,
  kegiatan: Calendar,
  kajian: BookOpen,
};

export default function PengumumanCard({ pengumuman }: PengumumanCardProps) {
  const IconComponent = KATEGORI_ICON[pengumuman.kategori] || Megaphone;

  return (
    <Link
      href={`/pengumuman/${pengumuman.id}`}
      className="card-hover group block overflow-hidden rounded-lg border border-[#F0EBE1] bg-white shadow-ambient"
    >
      {/* Foto atau Placeholder */}
      {pengumuman.foto_url ? (
        <div className="relative h-[180px] w-full">
          <Image
            src={pengumuman.foto_url}
            alt={pengumuman.judul}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex h-[140px] items-center justify-center bg-[#F9F6F0]">
          <IconComponent className="h-10 w-10 text-[#8D9F96]" />
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        {/* Kategori pill & tanggal */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#F9F6F0] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0A2E1F]">
            {KATEGORI_LABEL[pengumuman.kategori] || pengumuman.kategori}
          </span>
          <span className="text-sm font-semibold text-[#D4AF37]">
            {formatTanggalPendek(pengumuman.created_at)}
          </span>
        </div>

        {/* Judul */}
        <h3 className="mt-3 line-clamp-2 text-base font-bold leading-tight text-[#15221C]">
          {pengumuman.judul}
        </h3>

        {/* Isi singkat */}
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#8D9F96]">
          {pengumuman.isi}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#8D9F96]">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatTanggalPendek(pengumuman.created_at)}</span>
          </div>
          <span className="text-sm font-semibold text-[#0A2E1F] group-hover:text-[#D4AF37] transition-colors">
            Selengkapnya →
          </span>
        </div>
      </div>
    </Link>
  );
}
