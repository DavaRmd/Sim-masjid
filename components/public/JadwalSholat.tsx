"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { getJadwalSholat } from "@/lib/jadwal-sholat";
import { KOTA_NAMA } from "@/lib/jadwal-sholat";
import { formatTanggalHari } from "@/lib/utils";
import type { JadwalSholat } from "@/types";

const SHOLAT_NAMES: { key: keyof JadwalSholat; label: string }[] = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

export default function JadwalSholatSection() {
  const [jadwal, setJadwal] = useState<JadwalSholat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    getJadwalSholat()
      .then((data) => {
        if (data) {
          setJadwal(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  // Update current time every minute for "Berikutnya" recalculation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Determine which prayer is next
  const nextPrayer = useMemo(() => {
    if (!jadwal) return null;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = SHOLAT_NAMES.map((s) => {
      const [h, m] = jadwal[s.key].split(":").map(Number);
      return { key: s.key, minutes: h * 60 + m };
    });

    // Sort by time
    prayers.sort((a, b) => a.minutes - b.minutes);

    // Find first prayer after now
    const next = prayers.find((p) => p.minutes > currentMinutes);
    if (next) return next.key;

    // If all prayers passed, Subuh is tomorrow's first
    return prayers[0].key;
  }, [jadwal, now]);

  const todayStr = formatTanggalHari(now.toISOString().split("T")[0]);

  // Loading state
  if (isLoading) {
    return (
      <section className="bg-[#EAF2EB] py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 h-7 w-48 animate-pulse rounded bg-[#D1D5DB]" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-[#D1D5DB]" />
          </div>
          <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 min-w-[100px] animate-pulse rounded-xl bg-[#D1D5DB]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !jadwal) {
    return (
      <section className="bg-[#EAF2EB] py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertCircle className="h-8 w-8 text-[#6B7280]" />
            <p className="text-sm text-[#6B7280]">
              Jadwal sholat tidak tersedia saat ini
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#EAF2EB] py-10">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            Jadwal Sholat Hari Ini
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">{todayStr}</p>
          <p className="text-xs text-[#6B7280]">{KOTA_NAMA}</p>
        </div>

        {/* Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-5 md:overflow-visible">
          {SHOLAT_NAMES.map(({ key, label }) => {
            const isNext = nextPrayer === key;
            return (
              <div
                key={key}
                className={`
                  min-w-[100px] flex-shrink-0 snap-start rounded-xl p-4 text-center shadow-sm
                  ${isNext ? "bg-[#346739] shadow-md" : "bg-white"}
                `}
              >
                {isNext && (
                  <span className="mb-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                    Berikutnya
                  </span>
                )}
                <p
                  className={`text-xs font-semibold uppercase ${
                    isNext ? "text-white" : "text-[#6B7280]"
                  }`}
                >
                  {label}
                </p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    isNext ? "text-white" : "text-[#1A1A1A]"
                  }`}
                >
                  {jadwal[key]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}