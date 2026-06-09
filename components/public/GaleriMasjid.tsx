"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Building2,
} from "lucide-react";
import type { FotoMasjid } from "@/types";

// ============================================================
// Konstanta slideshow
// ============================================================
const SLIDE_INTERVAL = 4000; // 4 detik per slide

interface GaleriMasjidProps {
  foto: FotoMasjid[];
  fallbackUrl?: string | null;
  namaMasjid?: string;
}

export default function GaleriMasjid({
  foto,
  fallbackUrl,
  namaMasjid = "Masjid",
}: GaleriMasjidProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gabungkan foto galeri + fallback foto tunggal
  const semuaFoto: { url: string; id: string }[] = foto.length > 0
    ? foto.map((f) => ({ url: f.url, id: f.id }))
    : fallbackUrl
    ? [{ url: fallbackUrl, id: "fallback" }]
    : [];

  const totalFoto = semuaFoto.length;

  // ── Auto-play ──────────────────────────────────────────────
  const startInterval = useCallback(() => {
    if (totalFoto <= 1) return;
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % totalFoto);
        setIsTransitioning(false);
      }, 300);
    }, SLIDE_INTERVAL);
  }, [totalFoto]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPaused) startInterval();
    return stopInterval;
  }, [isPaused, startInterval, stopInterval]);

  // ── Navigasi ───────────────────────────────────────────────
  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    stopInterval();
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
      if (!isPaused) startInterval();
    }, 300);
  };

  const goPrev = () => goTo((currentIndex - 1 + totalFoto) % totalFoto);
  const goNext = () => goTo((currentIndex + 1) % totalFoto);

  // ── Hover pause ────────────────────────────────────────────
  const handleMouseEnter = () => {
    if (!isPaused) stopInterval();
  };
  const handleMouseLeave = () => {
    if (!isPaused) startInterval();
  };

  // ── Toggle pause manual ────────────────────────────────────
  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) stopInterval();
      else startInterval();
      return next;
    });
  };

  // ── Fallback: tidak ada foto sama sekali ───────────────────
  if (totalFoto === 0) {
    return (
      <div className="relative flex h-[250px] items-center justify-center bg-gradient-to-br from-[#346739] to-[#2A5230] md:h-[320px] lg:h-[400px]">
        <div className="flex flex-col items-center gap-3 text-white">
          <Building2 className="h-16 w-16 opacity-80" />
          <p className="text-lg font-semibold opacity-90">{namaMasjid}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative h-[250px] overflow-hidden md:h-[320px] lg:h-[400px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Foto-foto (rendered semua, opacity toggle) ───────── */}
      {semuaFoto.map((item, index) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          style={{
            opacity: index === currentIndex && !isTransitioning ? 1 : 0,
            zIndex: index === currentIndex ? 1 : 0,
          }}
        >
          <Image
            src={item.url}
            alt={`Foto Masjid ${index + 1}`}
            fill
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      {/* ── Overlay gradient bawah ───────────────────────────── */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* ── Tombol Pause/Play (pojok kanan atas) ─────────────── */}
      {totalFoto > 1 && (
        <button
          onClick={togglePause}
          aria-label={isPaused ? "Lanjutkan slideshow" : "Jeda slideshow"}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-all hover:bg-black/50 group-hover:opacity-100"
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
      )}

      {/* ── Tombol Prev ──────────────────────────────────────── */}
      {totalFoto > 1 && (
        <button
          onClick={goPrev}
          aria-label="Foto sebelumnya"
          className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 shadow-sm transition-all hover:bg-white/90 md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5 text-[#346739]" />
        </button>
      )}

      {/* ── Tombol Next ──────────────────────────────────────── */}
      {totalFoto > 1 && (
        <button
          onClick={goNext}
          aria-label="Foto berikutnya"
          className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 shadow-sm transition-all hover:bg-white/90 md:opacity-0 md:group-hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5 text-[#346739]" />
        </button>
      )}

      {/* ── Dot Indicator (bawah tengah) ─────────────────────── */}
      {totalFoto > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {semuaFoto.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              aria-label={`Ke foto ${index + 1}`}
              className="rounded-full transition-all duration-200 ease-in-out"
              style={{
                width: index === currentIndex ? 12 : 8,
                height: index === currentIndex ? 12 : 8,
                backgroundColor:
                  index === currentIndex
                    ? "#346739"
                    : "rgba(255,255,255,0.7)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
