"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Upload, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Pengumuman, KategoriPengumuman } from "@/types";

const KATEGORI_LIST = [
  { value: "pengumuman", label: "Pengumuman" },
  { value: "kegiatan", label: "Kegiatan" },
  { value: "kajian", label: "Kajian" },
];

interface PengumumanFormProps {
  mode: "tambah" | "edit";
  dataAwal?: Pengumuman;
}

/**
 * Validasi URL video: harus diawali domain YouTube atau Facebook
 */
function isValidVideoUrl(url: string): boolean {
  if (!url) return true; // optional field
  const allowedPrefixes = [
    "https://youtube.com",
    "https://www.youtube.com",
    "https://youtu.be",
    "https://facebook.com",
    "https://www.facebook.com",
    "https://fb.watch",
  ];
  return allowedPrefixes.some((prefix) => url.startsWith(prefix));
}

/**
 * Kompresi gambar via Canvas API
 * - Resize: max 1200px width (jaga aspect ratio)
 * - Quality: 0.7 JPEG
 * - Target: max 500KB
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const maxWidth = 1200;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Gagal membuat canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Gagal mengompresi gambar"));
        },
        "image/jpeg",
        0.7,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar"));
    };

    img.src = url;
  });
}

export default function PengumumanForm({ mode, dataAwal }: PengumumanFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [judul, setJudul] = useState(dataAwal?.judul ?? "");
  const [kategori, setKategori] = useState(dataAwal?.kategori ?? "pengumuman");
  const [isi, setIsi] = useState(dataAwal?.isi ?? "");

  // Foto
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(
    dataAwal?.foto_url ?? null,
  );
  const [isRemovingFoto, setIsRemovingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video
  const [videoUrl, setVideoUrl] = useState(dataAwal?.video_url ?? "");
  const [videoError, setVideoError] = useState("");

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Ukuran file lebih dari 2MB. Gambar akan dikompresi otomatis.");
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExistingFotoUrl(null);
    setIsRemovingFoto(false);
  };

  const handleRemoveFoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (mode === "edit" && existingFotoUrl) {
      setIsRemovingFoto(true);
      setExistingFotoUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(value);
    if (value && !isValidVideoUrl(value)) {
      setVideoError(
        "URL harus diawali https://youtube.com, https://youtu.be, atau https://facebook.com",
      );
    } else {
      setVideoError("");
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!judul.trim()) {
      newErrors.judul = "Judul tidak boleh kosong";
    } else if (judul.length > 255) {
      newErrors.judul = "Judul maksimal 255 karakter";
    }

    if (!kategori) {
      newErrors.kategori = "Pilih kategori";
    }

    if (!isi.trim()) {
      newErrors.isi = "Isi pengumuman tidak boleh kosong";
    }

    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      newErrors.videoUrl = "URL video tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      let fotoUrl = existingFotoUrl;

      // Jika menghapus foto existing
      if (isRemovingFoto) {
        fotoUrl = null;
      }

      // Upload foto baru jika ada
      if (selectedFile) {
        const compressed = await compressImage(selectedFile);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
        const filePath = `pengumuman/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("sim-masjid")
          .upload(filePath, compressed, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Detail error upload:", uploadError);
          toast.error("Gagal mengupload foto. Silakan coba lagi.");
          setIsLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("sim-masjid")
          .getPublicUrl(filePath);

        fotoUrl = urlData.publicUrl;
      }

      const payload = {
        judul: judul.trim(),
        kategori,
        isi: isi.trim(),
        foto_url: fotoUrl,
        video_url: videoUrl.trim() || null,
        is_aktif: dataAwal?.is_aktif ?? true,
        updated_at: new Date().toISOString(),
      };

      if (mode === "tambah") {
        const { error } = await supabase.from("pengumuman").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pengumuman")
          .update(payload)
          .eq("id", dataAwal!.id);

        if (error) throw error;
      }

      toast.success(
        mode === "tambah"
          ? "Pengumuman berhasil ditambahkan"
          : "Pengumuman berhasil disimpan",
      );
      router.push("/admin/pengumuman");
      router.refresh();
    } catch (error) {
      console.error("Gagal menyimpan pengumuman:", error);
      toast.error("Gagal menyimpan pengumuman. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">
            {mode === "tambah" ? "Tulis Pengumuman Baru" : "Edit Pengumuman"}
          </h1>
          <p className="text-sm text-[#8D9F96] mt-1">
            Buat kabar atau publikasi agenda masjid terbaru untuk jamaah.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#F0EBE1] bg-white p-6 md:p-8 shadow-ambient">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== Judul ===== */}
          <div className="space-y-2">
            <Label htmlFor="judul" className="text-sm font-bold text-[#0A2E1F]">
              Judul Informasi <span className="text-rose-600">*</span>
            </Label>
            <div className="relative">
              <Input
                id="judul"
                type="text"
                maxLength={255}
                placeholder="Contoh: Kajian Rutin Ahad Pagi Masjid Al-Ittihad"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                disabled={isLoading}
                className="h-11 rounded-xl border-[#F0EBE1] bg-[#F9F6F0]/50 pr-16 text-sm text-[#15221C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8D9F96]">
                {judul.length}/255
              </span>
            </div>
            {errors.judul && (
              <p className="text-xs font-medium text-rose-600">{errors.judul}</p>
            )}
          </div>

          {/* ===== Kategori ===== */}
          <div className="space-y-2">
            <Label htmlFor="kategori" className="text-sm font-bold text-[#0A2E1F]">
              Kategori <span className="text-rose-600">*</span>
            </Label>
            <select
              id="kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value as KategoriPengumuman)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[#F0EBE1] bg-[#F9F6F0]/50 px-3.5 text-sm font-medium text-[#15221C] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            >
              {KATEGORI_LIST.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            {errors.kategori && (
              <p className="text-xs font-medium text-rose-600">{errors.kategori}</p>
            )}
          </div>

          {/* ===== Isi ===== */}
          <div className="space-y-2">
            <Label htmlFor="isi" className="text-sm font-bold text-[#0A2E1F]">
              Isi Informasi <span className="text-rose-600">*</span>
            </Label>
            <Textarea
              id="isi"
              placeholder="Tulis deskripsi atau isi pengumuman secara lengkap..."
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              disabled={isLoading}
              className="min-h-[220px] rounded-xl border-[#F0EBE1] bg-[#F9F6F0]/50 text-sm text-[#15221C] placeholder:text-[#8D9F96] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 resize-y"
            />
            {errors.isi && (
              <p className="text-xs font-medium text-rose-600">{errors.isi}</p>
            )}
          </div>

          {/* ===== Foto ===== */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-[#0A2E1F]">Foto / Banner (opsional)</Label>

            {existingFotoUrl && !isRemovingFoto ? (
              <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border border-[#F0EBE1] bg-[#F9F6F0]">
                <Image
                  src={existingFotoUrl}
                  alt="Foto pengumuman"
                  width={400}
                  height={225}
                  className="h-auto w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveFoto}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                  title="Hapus foto"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="px-3 py-2 text-xs text-[#8D9F96]">
                  Foto saat ini. Pilih berkas baru jika ingin mengganti.
                </p>
              </div>
            ) : previewUrl ? (
              <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border border-[#F0EBE1] bg-[#F9F6F0]">
                <Image
                  src={previewUrl}
                  alt="Preview foto"
                  width={400}
                  height={225}
                  className="h-auto w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveFoto}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                  title="Hapus foto"
                >
                  <X className="h-4 w-4" />
                </button>
                {selectedFile && (
                  <p className="px-3 py-2 text-xs text-[#8D9F96]">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    {selectedFile.size > 2 * 1024 * 1024 && (
                      <span className="ml-2 inline-flex items-center gap-1 font-bold text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Akan dikompresi otomatis
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full max-w-[400px] flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#8D9F96]/40 bg-[#F9F6F0] px-6 py-8 text-[#8D9F96] transition-all hover:border-[#0A2E1F] hover:text-[#0A2E1F]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A2E1F]/10 text-[#0A2E1F]">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-[#0A2E1F]">Klik untuk unggah foto</span>
                <span className="text-xs text-[#8D9F96]">JPG, PNG, atau WebP (Maks 2MB)</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* ===== Video URL ===== */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-sm font-bold text-[#0A2E1F]">
              Link Video YouTube / Facebook (opsional)
            </Label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              disabled={isLoading}
              className="h-11 rounded-xl border-[#F0EBE1] bg-[#F9F6F0]/50 text-sm text-[#15221C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
            />
            {videoError ? (
              <p className="text-xs font-medium text-rose-600">{videoError}</p>
            ) : (
              <p className="text-xs text-[#8D9F96]">
                Tempelkan tautan video YouTube atau Facebook jika tersedia.
              </p>
            )}
          </div>

          {/* ===== Tombol ===== */}
          <div className="flex gap-3 pt-6 border-t border-[#F0EBE1]">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => router.push("/admin/pengumuman")}
              className="h-11 rounded-full border-[#F0EBE1] text-[#15221C] hover:bg-[#F9F6F0] px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 rounded-full bg-[#0A2E1F] text-white hover:bg-[#15221C] shadow-ambient font-bold px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pengumuman"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}