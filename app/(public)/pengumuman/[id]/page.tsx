import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowLeft, MessageCircle } from "lucide-react";
import { formatTanggalHari } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const KATEGORI_BADGE: Record<string, string> = {
  pengumuman: "bg-[#EAF2EB] text-[#346739]",
  kegiatan: "bg-[#EFF6FF] text-[#2563EB]",
  kajian: "bg-[#FFF7ED] text-[#C2410C]",
};

const KATEGORI_LABEL: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  kajian: "Kajian",
};

/**
 * Extract YouTube video ID dari berbagai format URL
 * Mendukung: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/v/
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isFacebookVideo(url: string): boolean {
  return url.includes("facebook.com") || url.includes("fb.watch");
}

interface DetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pengumuman")
    .select("judul, isi")
    .eq("id", params.id)
    .eq("is_aktif", true)
    .single();

  if (!data) {
    return { title: "Pengumuman Tidak Ditemukan" };
  }

  return {
    title: data.judul,
    description: data.isi.slice(0, 150),
  };
}

export default async function DetailPengumumanPage({ params }: DetailPageProps) {
  const supabase = await createClient();
  const { data: pengumuman } = await supabase
    .from("pengumuman")
    .select("*")
    .eq("id", params.id)
    .eq("is_aktif", true)
    .single();

  if (!pengumuman) {
    notFound();
  }

  const youtubeId = pengumuman.video_url ? extractYouTubeVideoId(pengumuman.video_url) : null;
  const hasFacebookVideo = pengumuman.video_url ? isFacebookVideo(pengumuman.video_url) : false;

  const shareText = `${pengumuman.judul} - ${process.env.NEXT_PUBLIC_SITE_URL || ""}/pengumuman/${pengumuman.id}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[800px] px-4 py-8 md:px-6 md:py-10 lg:px-8">
        {/* Tombol Kembali */}
        <Link
          href="/pengumuman"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#346739]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pengumuman
        </Link>

        {/* Badge Kategori */}
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            KATEGORI_BADGE[pengumuman.kategori] || "bg-[#EAF2EB] text-[#346739]"
          }`}
        >
          {KATEGORI_LABEL[pengumuman.kategori] || pengumuman.kategori}
        </span>

        {/* Judul */}
        <h1 className="mt-3 text-[28px] font-bold leading-tight text-[#1A1A1A]">
          {pengumuman.judul}
        </h1>

        {/* Tanggal */}
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[#6B7280]">
          <Calendar className="h-4 w-4" />
          <span>{formatTanggalHari(pengumuman.created_at)}</span>
        </div>

        <Separator className="my-6" />

        {/* Foto */}
        {pengumuman.foto_url && (
          <div className="relative mb-6 max-h-[400px] w-full overflow-hidden rounded-xl">
            <Image
              src={pengumuman.foto_url}
              alt={pengumuman.judul}
              width={800}
              height={400}
              className="h-auto max-h-[400px] w-full object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}

        {/* Isi Pengumuman */}
        <div
          className="text-base text-[#1A1A1A] whitespace-pre-wrap"
          style={{ lineHeight: "1.8" }}
        >
          {pengumuman.isi}
        </div>

        {/* Video Embed */}
        {(youtubeId || hasFacebookVideo) && (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Video Pengumuman"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : hasFacebookVideo ? (
              <iframe
                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(pengumuman.video_url!)}&show_text=false`}
                title="Video Pengumuman"
                className="h-full w-full"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : null}
          </div>
        )}

        <Separator className="my-6" />

        {/* Tombol Share WhatsApp */}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Bagikan ke WhatsApp
        </a>
      </div>
    </div>
  );
}