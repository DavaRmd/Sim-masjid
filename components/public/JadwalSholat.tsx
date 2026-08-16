"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle, CalendarDays } from "lucide-react";
import { getJadwalSholat, KOTA_NAMA } from "@/lib/jadwal-sholat";
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

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const nextPrayer = useMemo(() => {
    if (!jadwal) return null;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = SHOLAT_NAMES.map((s) => {
      const [h, m] = jadwal[s.key].split(":").map(Number);
      return { key: s.key, minutes: h * 60 + m };
    });

    prayers.sort((a, b) => a.minutes - b.minutes);

    const next = prayers.find((p) => p.minutes > currentMinutes);
    if (next) return next.key;

    return prayers[0].key;
  }, [jadwal, now]);

  const loadingUI = (
    <div className="bg-white rounded-lg shadow-ambient border border-[#F0EBE1] p-6">
      <div className="mb-6 h-6 w-36 animate-pulse rounded bg-[#F0EBE1]" />
      <div className="h-4 w-48 animate-pulse rounded bg-[#F0EBE1] mb-8" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between py-3 border-b border-[#F0EBE1]">
          <div className="h-4 w-20 animate-pulse rounded bg-[#F0EBE1]" />
          <div className="h-4 w-12 animate-pulse rounded bg-[#F0EBE1]" />
        </div>
      ))}
    </div>
  );

  const errorUI = (
    <div className="bg-white rounded-lg shadow-ambient border border-[#F0EBE1] p-8 text-center">
      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[#8D9F96]" />
      <p className="text-sm text-[#8D9F96]">Jadwal sholat tidak tersedia saat ini</p>
    </div>
  );

  if (isLoading) return loadingUI;
  if (error || !jadwal) return errorUI;

  return (
    <div className="bg-white rounded-lg shadow-ambient border border-[#F0EBE1] p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0A2E1F]">
            Jadwal Shalat
          </h2>
          <p className="mt-0.5 text-sm text-[#8D9F96]">{KOTA_NAMA}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F6F0] text-[#0A2E1F]">
          <CalendarDays className="h-4 w-4" />
        </div>
      </div>

      <div className="flex flex-col">
        {SHOLAT_NAMES.map(({ key, label }) => {
          const isNext = nextPrayer === key;
          return isNext ? (
            <div
              key={key}
              className="my-1 flex h-16 items-center justify-between rounded-r-md border-l-4 border-[#D4AF37] bg-[#D4AF37]/5 px-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#0A2E1F]">{label}</span>
                <span className="rounded-sm bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Sekarang
                </span>
              </div>
              <span className="text-lg font-bold text-[#0A2E1F]">{jadwal[key]}</span>
            </div>
          ) : (
            <div
              key={key}
              className="time-row flex h-14 items-center justify-between rounded-md border-b border-[#F0EBE1] px-4 last:border-b-0"
            >
              <span className="text-base font-medium text-[#15221C]">{label}</span>
              <span className="text-base font-semibold text-[#15221C]">{jadwal[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
