"use client";

import { useState, useEffect, useMemo } from "react";
import { getJadwalSholat } from "@/lib/jadwal-sholat";
import type { JadwalSholat } from "@/types";

const SHOLAT_NAMES: { key: keyof JadwalSholat; label: string }[] = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

function toMinutes(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getHijriDate() {
  try {
    return new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
}

export default function PrayerCountdown() {
  const [jadwal, setJadwal] = useState<JadwalSholat | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    getJadwalSholat().then((data) => {
      if (data) setJadwal(data);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { nextLabel, countdown } = useMemo(() => {
    if (!jadwal) return { nextLabel: "...", countdown: { h: "00", m: "00", s: "00" } };

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = SHOLAT_NAMES.map((s) => ({
      key: s.key,
      label: s.label,
      minutes: toMinutes(jadwal[s.key]),
    }));

    prayers.sort((a, b) => a.minutes - b.minutes);

    let next = prayers.find((p) => p.minutes > currentMinutes);
    if (!next) next = prayers[0]; // wrap to subuh tomorrow

    const targetMins = next.minutes > currentMinutes
      ? next.minutes
      : next.minutes + 24 * 60;

    const diffSecs =
      (targetMins - currentMinutes) * 60 - now.getSeconds();

    const h = Math.floor(diffSecs / 3600);
    const m = Math.floor((diffSecs % 3600) / 60);
    const s = diffSecs % 60;

    return {
      nextLabel: next.label,
      countdown: {
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      },
    };
  }, [jadwal, now]);

  const hijriDate = getHijriDate();

  return (
    <div className="relative overflow-hidden rounded-lg bg-[#0A2E1F] p-6 md:p-8 shadow-ambient">
      {/* Decorative atmospheric blurs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white opacity-[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#D4AF37] opacity-[0.07] blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          Menuju {nextLabel}
        </p>

        {/* Countdown digits */}
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-sans text-5xl font-bold leading-none tracking-tight text-[#D4AF37] md:text-6xl">
            {countdown.h}
          </span>
          <span className="mb-1 text-3xl font-light text-[#D4AF37]/50">:</span>
          <span className="font-sans text-5xl font-bold leading-none tracking-tight text-[#D4AF37] md:text-6xl">
            {countdown.m}
          </span>
          <span className="mb-1 text-3xl font-light text-[#D4AF37]/50">:</span>
          <span className="font-sans text-5xl font-bold leading-none tracking-tight text-[#D4AF37] md:text-6xl">
            {countdown.s}
          </span>
        </div>

        {hijriDate && (
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-white/40">
            {hijriDate}
          </p>
        )}
      </div>
    </div>
  );
}
