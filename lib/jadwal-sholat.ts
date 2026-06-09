import { JadwalSholat } from "@/types";

// ID kota Serang di MyQuran API — hardcode, tidak dinamis
const KOTA_ID = "1219";
export const KOTA_NAMA = "Kota Serang, Banten";

/**
 * Fetch jadwal sholat hari ini dari MyQuran API
 * Di-cache 24 jam menggunakan Next.js built-in revalidate
 */
export async function getJadwalSholat(): Promise<JadwalSholat | null> {
  const today = new Date();
  const tahun = today.getFullYear();
  const bulan = String(today.getMonth() + 1).padStart(2, "0");
  const tanggal = String(today.getDate()).padStart(2, "0");

  const url = `https://api.myquran.com/v2/sholat/jadwal/${KOTA_ID}/${tahun}/${bulan}/${tanggal}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // cache 24 jam
    });

    if (!res.ok) {
      console.error("Gagal fetch jadwal sholat:", res.statusText);
      return null;
    }

    const json = await res.json();

    if (!json.data?.jadwal) {
      console.error("Data jadwal sholat tidak valid");
      return null;
    }

    const jadwal = json.data.jadwal;

    return {
      subuh: jadwal.subuh,
      dzuhur: jadwal.dzuhur,
      ashar: jadwal.ashar,
      maghrib: jadwal.maghrib,
      isya: jadwal.isya,
    };
  } catch (error) {
    console.error("Error fetch jadwal sholat:", error);
    return null; // tampilkan error state jika API gagal
  }
}