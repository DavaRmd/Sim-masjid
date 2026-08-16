"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/utils";

interface KeuanganChartProps {
  pemasukan: number;
  pengeluaran: number;
}

const COLORS = {
  pemasukan: "#0A2E1F",
  pengeluaran: "#D4AF37",
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-lg border border-[#F0EBE1] bg-white px-4 py-3 shadow-hover">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8D9F96]">{item.name}</p>
        <p className="mt-1 text-base font-bold text-[#0A2E1F]">{formatRupiah(item.value)}</p>
      </div>
    );
  }
  return null;
};

export default function KeuanganChart({ pemasukan, pengeluaran }: KeuanganChartProps) {
  const total = pemasukan + pengeluaran;

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="h-40 w-40 rounded-full border-[12px] border-[#F0EBE1]" />
      </div>
    );
  }

  const data = [
    { name: "Pemasukan", value: pemasukan },
    { name: "Pengeluaran", value: pengeluaran },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? COLORS.pemasukan : COLORS.pengeluaran}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">Total</p>
          <p className="text-sm font-bold text-[#0A2E1F]">{formatRupiah(total)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#0A2E1F]" />
          <span className="text-xs font-medium text-[#8D9F96]">Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#D4AF37]" />
          <span className="text-xs font-medium text-[#8D9F96]">Pengeluaran</span>
        </div>
      </div>
    </div>
  );
}
