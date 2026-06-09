import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";
import JadwalSholatSection from "@/components/public/JadwalSholat";
import PengumumanCard from "@/components/public/PengumumanCard";
import DonasiSection from "@/components/public/DonasiSection";
import type { ProfilMasjid, Pengumuman } from "@/types";

export default async function BerandaPage() {
  const supabase = await createClient();

  // Fetch profil masjid
  const { data: profil } = await supabase
    .from("profil_masjid")
    .select("*")
    .limit(1)
    .single();

  const profilData: ProfilMasjid | null = profil;

  // Fetch 3 pengumuman terbaru
  const { data: pengumumanData } = await supabase
    .from("pengumuman")
    .select("*")
    .eq("is_aktif", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const pengumumanTerbaru: Pengumuman[] = pengumumanData ?? [];

  // URL embed Google Maps berdasarkan alamat masjid
  const mapsEmbedUrl = profilData?.alamat
    ? `https://maps.google.com/maps?q=${encodeURIComponent(profilData.alamat)}&output=embed&hl=id`
    : null;

  // URL untuk tombol "Buka di Google Maps"
  const mapsOpenUrl =
    profilData?.link_maps ||
    (profilData?.alamat
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profilData.alamat)}`
      : null);

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* ========== HERO ========== */}
      <section className="relative h-[320px] overflow-hidden md:h-[400px]">
        {profilData?.foto_url ? (
          <Image
            src={profilData.foto_url}
            alt={profilData.nama_masjid}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#346739] to-[#2A5230]" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Teks hero */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
          <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            {profilData?.nama_masjid ?? "SIM Masjid"}
          </h1>
          {profilData?.alamat && (
            <p className="mt-2 text-sm text-white/80 md:text-base">
              {profilData.alamat}
            </p>
          )}
        </div>
      </section>

      {/* ========== JADWAL SHOLAT ========== */}
      <JadwalSholatSection />

      {/* ========== LOKASI MASJID ========== */}
      {mapsEmbedUrl && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF2EB]">
                  <MapPin className="h-4 w-4 text-[#346739]" />
                </div>
                <h2 className="text-xl font-semibold text-[#1A1A1A]">
                  Lokasi Masjid
                </h2>
              </div>
              {mapsOpenUrl && (
                <a
                  href={mapsOpenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#346739] px-4 py-2 text-sm font-medium text-[#346739] transition-colors hover:bg-[#EAF2EB]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buka di Google Maps
                </a>
              )}
            </div>

            {/* Layout: Map + Alamat Info */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Peta Google Maps — Lebih lebar di desktop */}
              <div className="overflow-hidden rounded-2xl border border-[#D1D5DB] shadow-sm lg:col-span-2">
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="360"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokasi Masjid di Google Maps"
                  className="block"
                />
              </div>

              {/* Info Alamat — Kolom kanan */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#D1D5DB] bg-[#FFFAF0] p-6 shadow-sm">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#346739]">
                    Alamat Lengkap
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#1A1A1A]">
                    {profilData?.nama_masjid}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                    {profilData?.alamat}
                  </p>
                </div>

                {mapsOpenUrl && (
                  <div className="mt-6">
                    <a
                      href={mapsOpenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#346739] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230]"
                    >
                      <MapPin className="h-4 w-4" />
                      Petunjuk Arah
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== PENGUMUMAN TERBARU ========== */}
      <section className="bg-[#FFFAF0] py-12">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">
              Pengumuman & Kegiatan Terbaru
            </h2>
            <Link
              href="/pengumuman"
              className="text-sm font-medium text-[#346739] hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>

          {pengumumanTerbaru.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pengumumanTerbaru.map((p) => (
                <PengumumanCard key={p.id} pengumuman={p} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#6B7280]">
              Belum ada pengumuman
            </p>
          )}
        </div>
      </section>

      {/* ========== DONASI INTERAKTIF ========== */}
      <DonasiSection
        noRekening={profilData?.no_rekening ?? null}
        namaBank={profilData?.nama_bank ?? null}
        atasNama={profilData?.atas_nama ?? null}
        qrisUrl={profilData?.qris_url ?? null}
      />
    </div>
  );
}