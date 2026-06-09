import { createClient } from "@/lib/supabase/server";
import KepengurusanList from "@/components/public/KepengurusanList";
import type { Kepengurusan } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kepengurusan DKM | SIM Masjid",
  description: "Susunan kepengurusan Dewan Kemakmuran Masjid (DKM)",
};

export default async function KepengurusanPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("kepengurusan")
    .select("*")
    .eq("is_aktif", true)
    .order("urutan", { ascending: true });

  const pengurusList: Kepengurusan[] = data ?? [];

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* ========== HEADER HALAMAN ========== */}
      <section className="bg-[#EAF2EB] py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A] md:text-3xl">
            Kepengurusan DKM
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Susunan struktur organisasi Dewan Kemakmuran Masjid
          </p>
        </div>
      </section>

      {/* ========== DAFTAR PENGURUS ========== */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <KepengurusanList pengurus={pengurusList} />
        </div>
      </section>
    </div>
  );
}
