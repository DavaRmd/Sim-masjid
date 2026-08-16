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
    <div className="rounded-2xl border border-[#F0EBE1] bg-white p-6 shadow-ambient md:p-8">
      {/* ── Header ──────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A2E1F]/10 text-[#0A2E1F]">
            <Images className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#0A2E1F]">
              Galeri Foto Masjid
            </h3>
            <p className="text-xs text-[#8D9F96]">
              Foto kegiatan, arsitektur, dan suasana masjid yang tampil di beranda.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isFullCapacity ? "bg-gray-100 text-gray-400" : "bg-[#0A2E1F]/10 text-[#0A2E1F]"
          }`}
        >
          {jumlahFoto}/{MAX_FOTO} foto
        </span>
      </div>

      {/* ── Loading skeleton ─────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-[#F0EBE1]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* ── Foto yang sudah ada ─────────────── */}
          {fotoList.map((foto) => (
            <div
              key={foto.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[#F0EBE1] shadow-sm bg-[#F9F6F0]"
            >
              <Image
                src={foto.url}
                alt="Foto galeri masjid"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Overlay gelap saat hover */}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/25" />

              {/* Tombol hapus */}
              <button
                onClick={() => handleHapusKonfirmasi(foto.id)}
                disabled={deletingId === foto.id}
                aria-label="Hapus foto"
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600/90 text-white opacity-0 shadow-md transition-all duration-200 hover:bg-rose-600 group-hover:opacity-100 disabled:opacity-50"
              >
                {deletingId === foto.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}

          {/* ── Cell upload (jika foto < MAX_FOTO) ─ */}
          {uploadingIndex !== null && (
            <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#0A2E1F] bg-[#0A2E1F]/5">
              <Loader2 className="h-8 w-8 animate-spin text-[#0A2E1F]" />
              <span className="text-xs font-bold text-[#0A2E1F]">Mengunggah...</span>
            </div>
          )}

          {!isFullCapacity && uploadingIndex === null && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#8D9F96]/40 bg-[#F9F6F0] transition-all hover:border-[#0A2E1F] hover:bg-[#0A2E1F]/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2E1F]/10 text-[#0A2E1F]">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0A2E1F]">Tambah Foto</span>
            </button>
          )}

          {/* ── Pesan kapasitas penuh ──────────── */}
          {isFullCapacity && uploadingIndex === null && (
            <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-[#F0EBE1] bg-[#F9F6F0]">
              <span className="px-3 text-center text-xs font-medium text-[#8D9F96]">
                Kapasitas maksimal ({MAX_FOTO} foto) tercapai
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#F0EBE1] bg-white p-6 shadow-ambient">
            <h4 className="text-lg font-bold text-[#0A2E1F]">
              Hapus Foto Galeri?
            </h4>
            <p className="mt-2 text-sm text-[#8D9F96]">
              Foto ini akan dihapus secara permanen dari galeri masjid.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleHapusBatal}
                className="flex-1 rounded-full border border-[#F0EBE1] px-4 py-2.5 text-sm font-semibold text-[#15221C] hover:bg-[#F9F6F0] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const foto = fotoList.find((f) => f.id === confirmHapusId);
                  if (foto) handleHapus(foto);
                }}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Catatan ──────────────────────────────── */}
      <p className="mt-5 text-xs text-[#8D9F96]">
        Maksimal {MAX_FOTO} foto · Format: JPG, PNG, WebP · Maks. 5MB per foto (otomatis dikompresi &lt; 500KB)
      </p>
    </div>
  );
}

