"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, Loader2, Images } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { FotoMasjid } from "@/types";

// ─────────────────────────────────────────────
// Konstanta
// ─────────────────────────────────────────────
const MAX_FOTO = 8;
const MAX_SIZE_BYTES = 500 * 1024; // 500 KB setelah kompresi

// ─────────────────────────────────────────────
// Kompresi gambar menggunakan Canvas API
// ─────────────────────────────────────────────
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Skala proporsional jika terlalu besar
      const MAX_DIM = 1920;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas tidak tersedia"));
      ctx.drawImage(img, 0, 0, width, height);

      // Coba kualitas 0.8 dulu, turunkan jika masih > 500KB
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Gagal kompresi gambar"));
            if (blob.size > MAX_SIZE_BYTES && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(blob);
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat gambar"));
    };
  });
}

// ─────────────────────────────────────────────
// Komponen GaleriManager
// ─────────────────────────────────────────────
export default function GaleriManager() {
  const [fotoList, setFotoList] = useState<FotoMasjid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmHapusId, setConfirmHapusId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch foto dari Supabase ─────────────────
  const fetchFoto = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("foto_masjid")
      .select("*")
      .order("urutan", { ascending: true });

    if (error) {
      toast.error("Gagal memuat galeri foto");
    } else {
      setFotoList((data as FotoMasjid[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFoto();
  }, [fetchFoto]);

  // ── Ekstrak path dari URL Storage ───────────
  const extractStoragePath = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split("/sim-masjid/");
      return parts[1] ?? null;
    } catch {
      return null;
    }
  };

  // ── Upload foto baru ─────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (fotoList.length >= MAX_FOTO) {
      toast.error(`Maksimal ${MAX_FOTO} foto`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB sebelum kompresi");
      return;
    }

    const tempIndex = fotoList.length;
    setUploadingIndex(tempIndex);

    try {
      const supabase = createClient();

      // Kompresi
      const compressed = await compressImage(file);
      const ext = "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `galeri/${filename}`;

      // Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from("sim-masjid")
        .upload(path, compressed, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error("Gagal mengupload foto", { description: uploadError.message });
        return;
      }

      // Ambil public URL
      const { data: urlData } = supabase.storage
        .from("sim-masjid")
        .getPublicUrl(path);

      // Insert ke tabel foto_masjid
      const urutan = fotoList.length > 0
        ? Math.max(...fotoList.map((f) => f.urutan)) + 1
        : 0;

      const { error: insertError } = await supabase
        .from("foto_masjid")
        .insert({ url: urlData.publicUrl, urutan });

      if (insertError) {
        toast.error("Gagal menyimpan data foto", { description: insertError.message });
        // Hapus file yang sudah terupload
        await supabase.storage.from("sim-masjid").remove([path]);
        return;
      }

      toast.success("Foto berhasil ditambahkan ke galeri");
      await fetchFoto();
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengupload foto");
      console.error(err);
    } finally {
      setUploadingIndex(null);
    }
  };

  // ── Konfirmasi hapus ─────────────────────────
  const handleHapusKonfirmasi = (id: string) => {
    setConfirmHapusId(id);
  };

  const handleHapusBatal = () => {
    setConfirmHapusId(null);
  };

  // ── Hapus foto ───────────────────────────────
  const handleHapus = async (foto: FotoMasjid) => {
    setDeletingId(foto.id);
    setConfirmHapusId(null);
    const supabase = createClient();

    try {
      // Hapus dari Storage
      const storagePath = extractStoragePath(foto.url);
      if (storagePath) {
        await supabase.storage.from("sim-masjid").remove([storagePath]);
      }

      // Hapus dari database
      const { error } = await supabase
        .from("foto_masjid")
        .delete()
        .eq("id", foto.id);

      if (error) {
        toast.error("Gagal menghapus foto", { description: error.message });
        return;
      }

      toast.success("Foto berhasil dihapus");
      await fetchFoto();
    } catch {
      toast.error("Terjadi kesalahan saat menghapus foto");
    } finally {
      setDeletingId(null);
    }
  };

  const jumlahFoto = fotoList.length;
  const isFullCapacity = jumlahFoto >= MAX_FOTO;

  return (
    <div className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm md:p-8">
      {/* ── Header ──────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-[#346739]" />
          <h3 className="text-base font-semibold text-[#1A1A1A]">
            Galeri Foto Masjid
          </h3>
        </div>
        <span
          className={`text-sm font-medium ${
            isFullCapacity ? "text-[#9CA3AF]" : "text-[#346739]"
          }`}
        >
          {jumlahFoto}/{MAX_FOTO} foto
        </span>
      </div>

      {/* ── Loading skeleton ─────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-xl bg-[#F3F4F6]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* ── Foto yang sudah ada ─────────────── */}
          {fotoList.map((foto) => (
            <div
              key={foto.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[#D1D5DB]"
            >
              <Image
                src={foto.url}
                alt="Foto galeri masjid"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Overlay gelap saat hover */}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

              {/* Tombol hapus */}
              <button
                onClick={() => handleHapusKonfirmasi(foto.id)}
                disabled={deletingId === foto.id}
                aria-label="Hapus foto"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#DC2626]/80 text-white opacity-0 transition-all hover:bg-[#DC2626] group-hover:opacity-100 disabled:opacity-50"
              >
                {deletingId === foto.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}

          {/* ── Cell upload (jika foto < MAX_FOTO) ─ */}
          {uploadingIndex !== null && (
            <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-[#346739] bg-[#EAF2EB]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#346739]" />
                <span className="text-xs text-[#346739]">Mengupload...</span>
              </div>
            </div>
          )}

          {!isFullCapacity && uploadingIndex === null && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D1D5DB] bg-[#F9FAF9] transition-colors hover:border-[#346739] hover:bg-[#EAF2EB]"
            >
              <Plus className="h-8 w-8 text-[#346739]" />
              <span className="text-xs text-[#6B7280]">Tambah Foto</span>
            </button>
          )}

          {/* ── Pesan kapasitas penuh ──────────── */}
          {isFullCapacity && uploadingIndex === null && (
            <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-[#D1D5DB] bg-[#F9FAF9]">
              <span className="px-2 text-center text-xs text-[#9CA3AF]">
                Maksimal {MAX_FOTO} foto tercapai
              </span>
            </div>
          )}
        </div>
      )}

      {/* Input file tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Dialog konfirmasi hapus ──────────────── */}
      {confirmHapusId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="mb-2 text-base font-semibold text-[#1A1A1A]">
              Hapus Foto?
            </h4>
            <p className="mb-6 text-sm text-[#6B7280]">
              Foto akan dihapus permanen dari galeri dan tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleHapusBatal}
                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F3F4F6]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const foto = fotoList.find((f) => f.id === confirmHapusId);
                  if (foto) handleHapus(foto);
                }}
                className="flex-1 rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B91C1C]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Catatan ──────────────────────────────── */}
      <p className="mt-4 text-xs text-[#9CA3AF]">
        Maksimal {MAX_FOTO} foto · Format: JPG, PNG, WebP · Maks. 5MB per foto (otomatis dikompres ke max 500KB)
      </p>
    </div>
  );
}
