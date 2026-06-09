import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
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