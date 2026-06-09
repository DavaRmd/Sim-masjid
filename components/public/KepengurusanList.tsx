import Image from "next/image";
import { User, Users } from "lucide-react";
import type { Kepengurusan } from "@/types";

interface KepengurusanListProps {
  pengurus: Kepengurusan[];
}

export default function KepengurusanList({ pengurus }: KepengurusanListProps) {
  if (pengurus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D1D5DB] bg-white py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF2EB] text-[#346739]">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-[#1A1A1A]">Belum Ada Pengurus</h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Susunan kepengurusan DKM belum dimasukkan oleh admin.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ========== DESKTOP VIEW (TABLE) ========== */}
      <div className="hidden overflow-hidden rounded-2xl border border-[#D1D5DB] bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm text-[#1A1A1A]">
          <thead className="bg-[#EAF2EB] text-xs font-semibold uppercase tracking-wider text-[#346739]">
            <tr>
              <th scope="col" className="px-6 py-4 w-24">Foto</th>
              <th scope="col" className="px-6 py-4">Nama Lengkap</th>
              <th scope="col" className="px-6 py-4">Jabatan</th>
              <th scope="col" className="px-6 py-4">Periode Jabatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {pengurus.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 1 ? "bg-[#FFFAF0]/50" : "bg-white"}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#D1D5DB] bg-muted">
                    {p.foto_url ? (
                      <Image
                        src={p.foto_url}
                        alt={p.nama}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F3F4F6] text-[#9CA3AF]">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-[#1A1A1A]">
                  {p.nama}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-[#EAF2EB] px-2.5 py-0.5 text-xs font-semibold text-[#346739]">
                    {p.jabatan}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#6B7280]">
                  {p.periode || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========== MOBILE VIEW (CARDS) ========== */}
      <div className="flex flex-col gap-4 md:hidden">
        {pengurus.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-2xl border border-[#D1D5DB] bg-white p-4 shadow-sm"
          >
            {/* Foto Kiri */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-[#D1D5DB] bg-muted">
              {p.foto_url ? (
                <Image
                  src={p.foto_url}
                  alt={p.nama}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F3F4F6] text-[#9CA3AF]">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info Kanan */}
            <div className="flex-1 min-w-0">
              <h4 className="truncate text-base font-semibold text-[#1A1A1A]">
                {p.nama}
              </h4>
              <p className="mt-0.5 text-xs text-[#346739] font-medium">
                {p.jabatan}
              </p>
              {p.periode && (
                <p className="mt-1 text-xs text-[#6B7280]">
                  Periode: {p.periode}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
