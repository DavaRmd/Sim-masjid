/**
 * Generate semua tanggal Jumat dalam satu bulan
 *
 * @param tahun - Tahun (contoh: 2026)
 * @param bulan - Bulan 1-12 (contoh: 6 untuk Juni)
 * @returns Array of Date objects untuk setiap hari Jumat dalam bulan tersebut
 *
 * Contoh output untuk Juni 2026:
 * [2026-06-05, 2026-06-12, 2026-06-19, 2026-06-26]
 */
export function getTanggalJumatDalamBulan(
  tahun: number,
  bulan: number,
): Date[] {
  const tanggalJumat: Date[] = [];
  const date = new Date(tahun, bulan - 1, 1);

  // Maju ke hari Jumat pertama
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }

  // Kumpulkan semua Jumat dalam bulan
  while (date.getMonth() === bulan - 1) {
    tanggalJumat.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }

  return tanggalJumat;
}