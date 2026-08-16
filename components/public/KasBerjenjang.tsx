import { Briefcase, HardHat, TrendingDown, TrendingUp } from "lucide-react";
import { formatRupiah, displaySaldo } from "@/lib/utils";
import type { RingkasanKas } from "@/types";

interface KasBerjenjangProps {
  ringkasan: RingkasanKas;
}

export default function KasBerjenjang({ ringkasan }: KasBerjenjangProps) {
  return (
    <div>
      {/* Saldo Utama Card — big dark green hero card */}
      <div className="relative mb-6 overflow-hidden rounded-lg bg-[#0A2E1F] p-8 text-center shadow-ambient">
        {/* Atmospheric blurs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white opacity-[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#D4AF37] opacity-[0.06] blur-3xl" />

        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          Total Kas Seluruh Masjid
        </p>
        <p className="relative mt-2 text-4xl font-bold tracking-tight text-[#D4AF37] md:text-5xl">
          {formatRupiah(displaySaldo(ringkasan.totalSeluruh))}
        </p>
        <p className="relative mt-2 text-xs text-white/30">
          Saldo bersih semua kas
        </p>
      </div>

      {/* Sub-cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Kas Umum */}
        <div className="rounded-lg border border-[#F0EBE1] bg-white p-5 shadow-ambient">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F9F6F0]">
              <Briefcase className="h-4 w-4 text-[#0A2E1F]" />
            </div>
            <span className="text-sm font-bold text-[#0A2E1F]">Kas Umum</span>
          </div>
          <p className="text-2xl font-bold text-[#15221C]">
            {formatRupiah(displaySaldo(ringkasan.kasUmum.saldo))}
          </p>
          <div className="mt-4 space-y-2 border-t border-[#F0EBE1] pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-[#8D9F96]">
                <TrendingUp className="h-3.5 w-3.5 text-[#0A2E1F]" />
                <span>Pemasukan</span>
              </div>
              <span className="font-semibold text-[#0A2E1F]">
                {formatRupiah(ringkasan.kasUmum.pemasukan)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-[#8D9F96]">
                <TrendingDown className="h-3.5 w-3.5 text-[#8D9F96]" />
                <span>Pengeluaran</span>
              </div>
              <span className="font-semibold text-[#8D9F96]">
                {formatRupiah(ringkasan.kasUmum.pengeluaran)}
              </span>
            </div>
          </div>
        </div>

        {/* Kas Renovasi */}
        <div className="rounded-lg border border-[#F0EBE1] bg-white p-5 shadow-ambient">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <HardHat className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <span className="text-sm font-bold text-[#0A2E1F]">Kas Renovasi</span>
          </div>
          <p className="text-2xl font-bold text-[#15221C]">
            {formatRupiah(displaySaldo(ringkasan.kasRenovasi.saldo))}
          </p>
          <div className="mt-4 space-y-2 border-t border-[#F0EBE1] pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-[#8D9F96]">
                <TrendingUp className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Pemasukan</span>
              </div>
              <span className="font-semibold text-[#D4AF37]">
                {formatRupiah(ringkasan.kasRenovasi.pemasukan)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-[#8D9F96]">
                <TrendingDown className="h-3.5 w-3.5 text-[#8D9F96]" />
                <span>Pengeluaran</span>
              </div>
              <span className="font-semibold text-[#8D9F96]">
                {formatRupiah(ringkasan.kasRenovasi.pengeluaran)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
