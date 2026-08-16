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
    <div className="rounded-lg border border-[#F0EBE1] bg-white p-6 shadow-ambient">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Heart className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
        </div>
        <h3 className="text-lg font-bold text-[#0A2E1F]">
          Daftar Donatur Kas Renovasi
        </h3>
      </div>
      <p className="mb-6 text-sm text-[#8D9F96]">
        Para muhsinin yang menyumbang untuk pembangunan &amp; renovasi masjid
      </p>

      {data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#F0EBE1]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#F9F6F0]">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Nama Donatur
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Nominal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {data.map((item, idx) => {
                const isAnonim =
                  !item.nama_donatur ||
                  item.nama_donatur.trim().toLowerCase() === "hamba allah";
                const displayNama = isAnonim ? "Hamba Allah" : item.nama_donatur;

                return (
                  <tr key={idx} className="bg-white transition-colors hover:bg-[#F9F6F0]">
                    <td className="whitespace-nowrap px-4 py-3 text-[#8D9F96]">
                      {formatTanggal(item.tanggal)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#15221C]">
                      {isAnonim ? (
                        <span className="italic font-normal text-[#8D9F96]">
                          {displayNama}
                        </span>
                      ) : (
                        <span>{displayNama}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#D4AF37]">
                      {formatRupiah(item.jumlah)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#F0EBE1] bg-[#F9F6F0] py-12 text-center">
          <p className="text-sm text-[#8D9F96]">Belum ada donatur kas renovasi tercatat.</p>
        </div>
      )}
    </div>
  );
}
