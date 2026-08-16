import { HardHat, TrendingDown } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { Keuangan } from "@/types";

interface RenovasiTerbaruProps {
  data: Keuangan[];
}

export default function RenovasiTerbaru({ data }: RenovasiTerbaruProps) {
  return (
    <div className="rounded-lg border border-[#F0EBE1] bg-white p-6 shadow-ambient">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <HardHat className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <h3 className="text-lg font-bold text-[#0A2E1F]">
          Pengeluaran Renovasi Terbaru
        </h3>
      </div>
      <p className="mb-6 text-sm text-[#8D9F96]">
        5 transaksi pengeluaran kas renovasi terakhir
      </p>

      {data.length > 0 ? (
        <div className="divide-y divide-[#F0EBE1]">
          {data.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex h-16 items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0EBE1]">
                  <TrendingDown className="h-3.5 w-3.5 text-[#8D9F96]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#15221C]">
                    {item.keterangan || item.kategori}
                  </p>
                  <p className="text-xs text-[#8D9F96]">
                    {formatTanggal(item.tanggal)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-[#8D9F96]">
                -{formatRupiah(item.jumlah)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#F0EBE1] bg-[#F9F6F0] py-10 text-center">
          <p className="text-sm text-[#8D9F96]">Belum ada pengeluaran renovasi</p>
        </div>
      )}

      <p className="mt-5 text-center text-xs italic text-[#8D9F96]">
        Untuk informasi lengkap, hubungi pengurus DKM
      </p>
    </div>
  );
}
