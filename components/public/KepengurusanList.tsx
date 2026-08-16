import Image from "next/image";
import { User, Users } from "lucide-react";
import type { Kepengurusan } from "@/types";

interface KepengurusanListProps {
  pengurus: Kepengurusan[];
}

export default function KepengurusanList({ pengurus }: KepengurusanListProps) {
  if (pengurus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#F0EBE1] bg-white py-16 text-center shadow-ambient">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9F6F0]">
          <Users className="h-6 w-6 text-[#8D9F96]" />
        </div>
        <h3 className="mt-4 text-base font-bold text-[#0A2E1F]">Belum Ada Pengurus</h3>
        <p className="mt-1 text-sm text-[#8D9F96]">
          Susunan kepengurusan DKM belum dimasukkan oleh admin.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ========== DESKTOP VIEW (TABLE) ========== */}
      <div className="hidden overflow-hidden rounded-lg border border-[#F0EBE1] shadow-ambient md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#F9F6F0]">
              <th scope="col" className="w-20 px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Foto
              </th>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Nama Lengkap
              </th>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Jabatan
              </th>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                Periode
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE1] bg-white">
            {pengurus.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-[#F9F6F0]">
                <td className="px-6 py-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#F0EBE1]">
                    {p.foto_url ? (
                      <Image
                        src={p.foto_url}
                        alt={p.nama}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#F9F6F0]">
                        <User className="h-5 w-5 text-[#8D9F96]" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[#15221C]">
                  {p.nama}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-[#0A2E1F]/5 px-3 py-1 text-xs font-bold text-[#0A2E1F]">
                    {p.jabatan}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#8D9F96]">
                  {p.periode || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========== MOBILE VIEW (CARDS) ========== */}
      <div className="flex flex-col gap-3 md:hidden">
        {pengurus.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-lg border border-[#F0EBE1] bg-white p-4 shadow-ambient"
          >
            {/* Avatar */}
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#F0EBE1]">
              {p.foto_url ? (
                <Image
                  src={p.foto_url}
                  alt={p.nama}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F9F6F0]">
                  <User className="h-5 w-5 text-[#8D9F96]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-[#15221C]">{p.nama}</p>
              <span className="mt-1 inline-block rounded-full bg-[#0A2E1F]/5 px-2.5 py-0.5 text-xs font-bold text-[#0A2E1F]">
                {p.jabatan}
              </span>
              {p.periode && (
                <p className="mt-1 text-xs text-[#8D9F96]">Periode: {p.periode}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
