import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";
import Image from "next/image";
import PrayerCountdown from "@/components/public/PrayerCountdown";
import JadwalSholatSection from "@/components/public/JadwalSholat";
import PengumumanCard from "@/components/public/PengumumanCard";
import DonasiSection from "@/components/public/DonasiSection";
import type { ProfilMasjid, Pengumuman } from "@/types";

export default async function BerandaPage() {
  const supabase = await createClient();

  const { data: profil } = await supabase
    .from("profil_masjid")
    .select("*")
    .limit(1)
    .single();

  const profilData: ProfilMasjid | null = profil;

  const { data: pengumumanData } = await supabase
    .from("pengumuman")
    .select("*")
    .eq("is_aktif", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const pengumumanTerbaru: Pengumuman[] = pengumumanData ?? [];

  const mapsOpenUrl =
    profilData?.link_maps ||
    (profilData?.alamat
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profilData.alamat)}`
      : null);

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">

      {/* ========== HERO BANNER ========== */}
      <div className="relative overflow-hidden bg-[#0A2E1F] py-10 md:py-14">
        {/* Foto masjid sebagai overlay */}
        {profilData?.foto_url && (
          <div className="absolute inset-0 z-0">
            <Image
              src={profilData.foto_url}
              alt={profilData.nama_masjid ?? "Masjid"}
              fill
              className="object-cover opacity-20"
              priority
            />
          </div>
        )}
        {/* Dekoratif blur */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white opacity-[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#D4AF37] opacity-[0.05] blur-3xl" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-4 sm:flex-row md:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-white md:text-4xl">
              Sistem Informasi Manajemen
              <br />
              Masjid (SIM) {profilData?.nama_masjid ?? "Al-Ittihad"}
            </h1>
            <p className="mt-2 text-sm font-medium text-[#D4AF37]">
              Membangun Kemakmuran Masjid di Era Digital
            </p>
          </div>

          {/* Avatar badge bulat */}
          {profilData?.foto_url && (
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#D4AF37] shadow-lg md:h-28 md:w-28">
              <Image
                src={profilData.foto_url}
                alt={profilData.nama_masjid ?? "Masjid"}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* ========== MAIN CONTENT 60/40 SPLIT ========== */}
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">

          {/* ========== KOLOM KIRI (60%) ========== */}
          <div className="flex flex-col gap-8 lg:w-[60%]">

            {/* Countdown Timer */}
            <PrayerCountdown />

            {/* Pengumuman & Kegiatan */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">
                  Pengumuman &amp; Kegiatan
                </h2>
                <Link
                  href="/pengumuman"
                  className="flex items-center gap-1 text-sm font-semibold text-[#D4AF37] transition-colors hover:text-[#0A2E1F]"
                >
                  Lihat Semua →
                </Link>
              </div>

              {pengumumanTerbaru.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {pengumumanTerbaru.map((p) => (
                    <PengumumanCard key={p.id} pengumuman={p} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-[#F0EBE1] bg-white py-12 text-center shadow-ambient">
                  <p className="text-sm text-[#8D9F96]">
                    Tidak ada pengumuman saat ini
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========== KOLOM KANAN (40%) ========== */}
          <div className="flex flex-col gap-6 lg:w-[40%]">

            {/* Jadwal Shalat Card */}
            <JadwalSholatSection />

            {/* Foto & Lokasi Widget */}
            <div className="overflow-hidden rounded-lg border border-[#F0EBE1] bg-white shadow-ambient">
              {/* Foto masjid */}
              <div className="relative h-48 w-full overflow-hidden bg-[#F9F6F0] md:h-52">
                {profilData?.foto_url ? (
                  <Image
                    src={profilData.foto_url}
                    alt={profilData?.nama_masjid ?? "Foto Masjid"}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MapPin className="h-10 w-10 text-[#8D9F96]" />
                  </div>
                )}
                <span className="absolute bottom-3 left-3 rounded-sm bg-[#0A2E1F]/80 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {profilData?.nama_masjid ?? "Foto Masjid"}
                </span>
              </div>

              {/* Info & Tombol */}
              <div className="flex flex-col gap-4 p-5">
                <div>
                  <h3 className="font-bold text-[#0A2E1F]">
                    {profilData?.nama_masjid ?? "Masjid"}
                  </h3>
                  {profilData?.alamat && (
                    <p className="mt-1 text-sm leading-relaxed text-[#8D9F96]">
                      {profilData.alamat}
                    </p>
                  )}
                </div>
                {mapsOpenUrl && (
                  <a
                    href={mapsOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ripple flex w-full items-center justify-center gap-2 rounded-full bg-[#F9F6F0] px-4 py-2.5 text-sm font-bold text-[#0A2E1F] transition-all hover:bg-[#0A2E1F] hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Dapatkan Petunjuk Arah
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========== DONASI SECTION ========== */}
      <DonasiSection
        noRekening={profilData?.no_rekening ?? null}
        namaBank={profilData?.nama_bank ?? null}
        atasNama={profilData?.atas_nama ?? null}
        qrisUrl={profilData?.qris_url ?? null}
      />
    </div>
  );
}
