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
    <div>
      <h1 className="mb-6 text-xl font-bold text-[#1A1A1A] md:text-2xl">
        {mode === "tambah" ? "Tulis Pengumuman Baru" : "Edit Pengumuman"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== Judul ===== */}
        <div className="space-y-2">
          <Label htmlFor="judul" className="text-sm font-medium">
            Judul <span className="text-[#DC2626]">*</span>
          </Label>
          <div className="relative">
            <Input
              id="judul"
              type="text"
              maxLength={255}
              placeholder="Masukkan judul pengumuman"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              disabled={isLoading}
              className="h-11 pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280]">
              {judul.length}/255
            </span>
          </div>
          {errors.judul && (
            <p className="text-sm text-[#DC2626]">{errors.judul}</p>
          )}
        </div>

        {/* ===== Kategori ===== */}
        <div className="space-y-2">
          <Label htmlFor="kategori" className="text-sm font-medium">
            Kategori <span className="text-[#DC2626]">*</span>
          </Label>
          <select
            id="kategori"
            value={kategori}
            onChange={(e) => setKategori(e.target.value as KategoriPengumuman)}
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
          >
            {KATEGORI_LIST.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          {errors.kategori && (
            <p className="text-sm text-[#DC2626]">{errors.kategori}</p>
          )}
        </div>

        {/* ===== Isi ===== */}
        <div className="space-y-2">
          <Label htmlFor="isi" className="text-sm font-medium">
            Isi Pengumuman <span className="text-[#DC2626]">*</span>
          </Label>
          <Textarea
            id="isi"
            placeholder="Tulis isi pengumuman di sini..."
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            disabled={isLoading}
            className="min-h-[200px] resize-y"
          />
          {errors.isi && (
            <p className="text-sm text-[#DC2626]">{errors.isi}</p>
          )}
        </div>

        {/* ===== Foto ===== */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Foto (opsional)</Label>

          {existingFotoUrl && !isRemovingFoto ? (
            <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border border-[#D1D5DB]">
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
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                title="Hapus foto"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="px-3 py-2 text-xs text-[#6B7280]">
                Foto saat ini. Pilih file baru untuk mengganti.
              </p>
            </div>
          ) : previewUrl ? (
            <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border border-[#D1D5DB]">
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
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
                title="Hapus foto"
              >
                <X className="h-4 w-4" />
              </button>
              {selectedFile && (
                <p className="px-3 py-2 text-xs text-[#6B7280]">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  {selectedFile.size > 2 * 1024 * 1024 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Akan dikompresi saat upload
                    </span>
                  )}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full max-w-[400px] flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#D1D5DB] px-6 py-8 text-[#6B7280] transition-colors hover:border-[#346739] hover:text-[#346739]"
            >
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">Klik untuk upload foto</span>
              <span className="text-xs">JPEG atau PNG, maks 2MB</span>
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
          <Label htmlFor="videoUrl" className="text-sm font-medium">
            Link Video (opsional)
          </Label>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            disabled={isLoading}
            className="h-11"
          />
          {videoError ? (
            <p className="text-sm text-[#DC2626]">{videoError}</p>
          ) : (
            <p className="text-xs text-[#6B7280]">
              Tempel link YouTube atau Facebook
            </p>
          )}
        </div>

        {/* ===== Tombol ===== */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 bg-[#346739] text-white hover:bg-[#2A5230]"
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
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => router.push("/admin/pengumuman")}
            className="h-11"
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}