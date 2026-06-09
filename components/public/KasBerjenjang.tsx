import { Briefcase, HardHat, TrendingDown, TrendingUp } from "lucide-react";
import { formatRupiah, displaySaldo } from "@/lib/utils";
import type { RingkasanKas } from "@/types";

interface KasBerjenjangProps {
  ringkasan: RingkasanKas;
}

export default function KasBerjenjang({ ringkasan }: KasBerjenjangProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {/* Total */}
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-[#6B7280]">
          Total Kas Seluruh Masjid
        </p>
        <p className="mt-1 text-[36px] font-bold text-[#346739]">
          {formatRupiah(displaySaldo(ringkasan.totalSeluruh))}
        </p>
      </div>

      {/* Sub-cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Kas Umum */}
        <div className="rounded-xl bg-[#EFF6FF] p-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#2563EB]" />
            <span className="text-sm font-semibold text-[#2563EB]">
              Kas Umum
            </span>
          </div>
          <p className="mt-2 text-[22px] font-semibold text-[#1A1A1A]">
            {formatRupiah(displaySaldo(ringkasan.kasUmum.saldo))}
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1 text-[13px]">
              <TrendingUp className="h-3.5 w-3.5 text-[#16A34A]" />
              <span className="text-[#6B7280]">Pemasukan</span>
              <span className="ml-auto font-medium text-[#16A34A]">
                {formatRupiah(ringkasan.kasUmum.pemasukan)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[13px]">
              <TrendingDown className="h-3.5 w-3.5 text-[#DC2626]" />
              <span className="text-[#6B7280]">Pengeluaran</span>
              <span className="ml-auto font-medium text-[#DC2626]">
                {formatRupiah(ringkasan.kasUmum.pengeluaran)}
              </span>
            </div>
          </div>
        </div>

        {/* Kas Renovasi */}
        <div className="rounded-xl bg-[#FFFBEB] p-4">
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-[#D97706]" />
            <span className="text-sm font-semibold text-[#D97706]">
              Kas Renovasi
            </span>
          </div>
          <p className="mt-2 text-[22px] font-semibold text-[#1A1A1A]">
            {formatRupiah(displaySaldo(ringkasan.kasRenovasi.saldo))}
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1 text-[13px]">
              <TrendingUp className="h-3.5 w-3.5 text-[#16A34A]" />
              <span className="text-[#6B7280]">Pemasukan</span>
              <span className="ml-auto font-medium text-[#16A34A]">
                {formatRupiah(ringkasan.kasRenovasi.pemasukan)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[13px]">
              <TrendingDown className="h-3.5 w-3.5 text-[#DC2626]" />
              <span className="text-[#6B7280]">Pengeluaran</span>
              <span className="ml-auto font-medium text-[#DC2626]">
                {formatRupiah(ringkasan.kasRenovasi.pengeluaran)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}