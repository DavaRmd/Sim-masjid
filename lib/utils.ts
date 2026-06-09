import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke string Rupiah
 * Contoh: 1500000 → "Rp 1.500.000"
 */
export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}

/**
 * Format tanggal ISO ke string Indonesia
 * Contoh: "2026-05-12" → "12 Mei 2026"
 */
export function formatTanggal(tanggal: string): string {
  return format(new Date(tanggal), "d MMMM yyyy", { locale: id });
}

/**
 * Format tanggal ISO ke string pendek Indonesia
 * Contoh: "2026-05-12" → "12 Mei"
 */
export function formatTanggalPendek(tanggal: string): string {
  return format(new Date(tanggal), "d MMM", { locale: id });
}

/**
 * Format tanggal ISO ke string lengkap dengan hari
 * Contoh: "2026-05-12" → "Jumat, 12 Mei 2026"
 */
export function formatTanggalHari(tanggal: string): string {
  return format(new Date(tanggal), "EEEE, d MMMM yyyy", { locale: id });
}

/**
 * Potong teks jika melebihi panjang maksimal
 * Contoh: truncateText("Halo dunia", 5) → "Halo..."
 */
export function truncateText(teks: string, maxLength: number): string {
  if (teks.length <= maxLength) return teks;
  return teks.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Saldo tidak boleh ditampilkan negatif di halaman publik
 * Contoh: displaySaldo(-500000) → 0
 */
export function displaySaldo(saldo: number): number {
  return Math.max(0, saldo);
}
