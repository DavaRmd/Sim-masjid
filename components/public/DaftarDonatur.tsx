import { Heart } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";

interface Donatur {
  nama_donatur: string | null;
  jumlah: number;
  tanggal: string;
}

interface DaftarDonaturProps {
  data: Donatur[];
}

export default function DaftarDonatur({ data }: DaftarDonaturProps) {
  return (
    <div className="rounded-xl bg-[#FFFAF0] p-6 border border-[#F3F4F6]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-[#16A34A] fill-[#16A34A]" />
        <h3 className="text-lg font-semibold text-[#1A1A1A]">
          Daftar Donatur Kas Renovasi
        </h3>
      </div>
      <p className="mb-6 text-[13px] text-[#6B7280]">
        Daftar donatur dan para muhsinin yang menyumbang untuk pembangunan/renovasi masjid
      </p>

      {/* List */}
      {data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#EAF2EB] text-xs font-semibold uppercase tracking-wider text-[#346739]">
              <tr>
                <th scope="col" className="px-4 py-3">Tanggal</th>
                <th scope="col" className="px-4 py-3">Nama Donatur</th>
                <th scope="col" className="px-4 py-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {data.map((item, idx) => {
                const isAnonim = !item.nama_donatur || item.nama_donatur.trim().toLowerCase() === "hamba allah";
                const displayNama = isAnonim ? "Hamba Allah" : item.nama_donatur;

                return (
                  <tr
                    key={idx}
                    className={idx % 2 === 1 ? "bg-[#FFFAF0]/30" : "bg-white"}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[#6B7280]">
                      {formatTanggal(item.tanggal)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                      {isAnonim ? (
                        <span className="italic text-[#9CA3AF] font-normal">{displayNama}</span>
                      ) : (
                        <span>{displayNama}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#16A34A]">
                      {formatRupiah(item.jumlah)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white py-12 text-center">
          <p className="text-sm text-[#6B7280]">Belum ada donatur kas renovasi tercatat.</p>
        </div>
      )}
    </div>
  );
}
