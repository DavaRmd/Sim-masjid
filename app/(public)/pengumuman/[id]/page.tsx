import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowLeft, MessageCircle, Megaphone, BookOpen } from "lucide-react";
import { formatTanggalHari } from "@/lib/utils";

const KATEGORI_LABEL: Record<string, string> = {
  pengumuman: "Pengumuman",
  kegiatan: "Kegiatan",
  kajian: "Kajian",
};

const KATEGORI_ICON: Record<string, React.FC<{ className?: string }>> = {
  pengumuman: Megaphone,
  kegiatan: Calendar,
  kajian: BookOpen,
};

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

  const IconComponent = KATEGORI_ICON[pengumuman.kategori] || Megaphone;

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">

      {/* ========== HERO HEADER ========== */}
      <div className="bg-[#0A2E1F] px-4 pb-8 pt-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          {/* Tombol Kembali */}
          <Link
            href="/pengumuman"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8D9F96] transition-colors hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pengumuman
          </Link>

          {/* Kategori pill */}
          <div className="mt-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <IconComponent className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
              {KATEGORI_LABEL[pengumuman.kategori] || pengumuman.kategori}
            </span>
          </div>

          {/* Judul */}
          <h1 className="mt-3 text-2xl font-bold leading-tight text-white md:text-3xl">
            {pengumuman.judul}
          </h1>

          {/* Tanggal */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-[#8D9F96]">
            <Calendar className="h-4 w-4" />
            <span>{formatTanggalHari(pengumuman.created_at)}</span>
          </div>
        </div>
      </div>

      {/* ========== KONTEN ARTIKEL ========== */}
      <div className="bg-[#F9F6F0] px-4 py-8 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">

          {/* Card konten */}
          <div className="rounded-lg border border-[#F0EBE1] bg-white p-6 shadow-ambient md:p-8">

            {/* Foto header */}
            {pengumuman.foto_url && (
              <div className="relative mb-6 h-[280px] w-full overflow-hidden rounded-lg md:h-[380px]">
                <Image
                  src={pengumuman.foto_url}
                  alt={pengumuman.judul}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>
            )}

            {/* Divider gold */}
            <div className="mb-6 h-0.5 w-12 rounded-full bg-[#D4AF37]" />

            {/* Isi Pengumuman */}
            <div className="text-base leading-[1.9] text-[#15221C] whitespace-pre-wrap">
              {pengumuman.isi}
            </div>

            {/* Video Embed */}
            {(youtubeId || hasFacebookVideo) && (
              <div className="mt-8 aspect-video w-full overflow-hidden rounded-lg">
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
          </div>

          {/* ========== FOOTER ACTIONS ========== */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <Link
              href="/pengumuman"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#8D9F96] transition-colors hover:text-[#0A2E1F]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Pengumuman
            </Link>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ripple inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Bagikan ke WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}