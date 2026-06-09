import { HardHat } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { Keuangan } from "@/types";

interface RenovasiTerbaruProps {
  data: Keuangan[];
}

export default function RenovasiTerbaru({ data }: RenovasiTerbaruProps) {
  return (
    <div className="rounded-xl bg-[#EAF2EB] p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <HardHat className="h-5 w-5 text-[#D97706]" />
        <h3 className="text-lg font-semibold text-[#1A1A1A]">
          Pengeluaran Kas Renovasi Terbaru
        </h3>
      </div>
      <p className="mb-4 text-[13px] text-[#6B7280]">
        5 transaksi pengeluaran renovasi terakhir
      </p>

      {/* List */}
      {data.length > 0 ? (
        <div className="divide-y divide-[#D1D5DB]">
          {data.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="text-xs text-[#6B7280]">
                  {formatTanggal(item.tanggal)}
                </p>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {item.keterangan || item.kategori}
                </p>
              </div>
              <p className="text-sm font-semibold text-[#DC2626]">
                {formatRupiah(item.jumlah)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-[#6B7280]">
          Belum ada pengeluaran renovasi
        </p>
      )}

      {/* Catatan */}
      <p className="mt-4 text-center text-xs italic text-[#6B7280]">
        Untuk informasi lengkap, hubungi pengurus DKM
      </p>
    </div>
  );
}