"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Kepengurusan } from "@/types";

interface KepengurusanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData: Kepengurusan | null;
}

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

      const MAX_DIM = 800; // Untuk foto profil DKM, 800x800 sudah sangat cukup dan hemat space
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
// Ekstrak path storage dari URL
// ─────────────────────────────────────────────
const extractStoragePath = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/sim-masjid/");
    return parts[1] ?? null;
  } catch {
    return null;
  }
};

export default function KepengurusanForm({
  isOpen,
  onClose,
  onSuccess,
  editingData,
}: KepengurusanFormProps) {
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [periode, setPeriode] = useState("");
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [urutan, setUrutan] = useState(0);
  const [isAktif, setIsAktif] = useState(true);

  // File upload state
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setNama(editingData.nama);
        setJabatan(editingData.jabatan);
        setPeriode(editingData.periode ?? "");
        setNoWhatsapp(editingData.no_whatsapp ?? "");
        setUrutan(editingData.urutan);
        setIsAktif(editingData.is_aktif);
        setFotoPreview(editingData.foto_url);
      } else {
        // Reset form
        setNama("");
        setJabatan("");
        setPeriode("");
        setNoWhatsapp("");
        setUrutan(0);
        setIsAktif(true);
        setFotoPreview(null);
      }
      setFotoFile(null);
    }
  }, [isOpen, editingData]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB sebelum kompresi");
      return;
    }

    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePreview = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    if (!jabatan.trim()) {
      toast.error("Jabatan wajib diisi");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      let finalFotoUrl = editingData?.foto_url ?? null;

      // Jika ada file foto baru yang dipilih
      if (fotoFile) {
        // Kompresi foto
        const compressed = await compressImage(fotoFile);
        const ext = "jpg";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `kepengurusan/${filename}`;

        // Upload ke storage
        const { error: uploadError } = await supabase.storage
          .from("sim-masjid")
          .upload(path, compressed, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw new Error(`Gagal upload foto: ${uploadError.message}`);
        }

        // Dapatkan URL publik
        const { data: urlData } = supabase.storage
          .from("sim-masjid")
          .getPublicUrl(path);

        finalFotoUrl = urlData.publicUrl;

        // Hapus foto lama jika mengedit dan ada foto sebelumnya
        if (editingData?.foto_url) {
          const oldPath = extractStoragePath(editingData.foto_url);
          if (oldPath) {
            await supabase.storage.from("sim-masjid").remove([oldPath]);
          }
        }
      } else if (fotoPreview === null && editingData?.foto_url) {
        // Foto dihapus oleh user
        const oldPath = extractStoragePath(editingData.foto_url);
        if (oldPath) {
          await supabase.storage.from("sim-masjid").remove([oldPath]);
        }
        finalFotoUrl = null;
      }

      const payload = {
        nama: nama.trim(),
        jabatan: jabatan.trim(),
        periode: periode.trim() || null,
        no_whatsapp: noWhatsapp.trim() || null,
        foto_url: finalFotoUrl,
        urutan: urutan,
        is_aktif: isAktif,
        updated_at: new Date().toISOString(),
      };

      if (editingData) {
        // Mode Edit
        const { error: updateError } = await supabase
          .from("kepengurusan")
          .update(payload)
          .eq("id", editingData.id);

        if (updateError) throw updateError;
        toast.success("Data pengurus berhasil diperbarui");
      } else {
        // Mode Tambah
        const { error: insertError } = await supabase
          .from("kepengurusan")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
        toast.success("Data pengurus berhasil ditambahkan");
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Gagal menyimpan data pengurus";
      toast.error(errMsg);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4 bg-[#EAF2EB]">
          <h3 className="text-lg font-bold text-[#1A1A1A]">
            {editingData ? "Edit Anggota Pengurus" : "Tambah Anggota Pengurus"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1 text-[#6B7280] hover:bg-black/5 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            {/* Foto Profil Input */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                Foto Profil
              </label>
              
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-dashed border-[#D1D5DB] bg-[#F9FAF9] flex items-center justify-center">
                {fotoPreview ? (
                  <>
                    <Image
                      src={fotoPreview}
                      alt="Pratinjau foto"
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePreview}
                      disabled={isSaving}
                      className="absolute right-0 top-0 rounded-full bg-[#DC2626] p-1 text-white shadow hover:bg-red-700 disabled:opacity-50"
                      aria-label="Hapus foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-1.5 text-center text-[#9CA3AF] hover:text-[#346739]"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Unggah Foto</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#9CA3AF]">
                Format JPG/PNG/WebP, Maks. 5MB (otomatis dikompresi)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1">
              <label htmlFor="nama" className="text-xs font-semibold text-[#6B7280]">
                Nama Lengkap <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: H. Ahmad Fauzi"
                disabled={isSaving}
                className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] disabled:opacity-50"
              />
            </div>

            {/* Jabatan */}
            <div className="flex flex-col gap-1">
              <label htmlFor="jabatan" className="text-xs font-semibold text-[#6B7280]">
                Jabatan <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="jabatan"
                type="text"
                required
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Ketua DKM / Sekretaris"
                disabled={isSaving}
                className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] disabled:opacity-50"
              />
            </div>

            {/* Periode Jabatan */}
            <div className="flex flex-col gap-1">
              <label htmlFor="periode" className="text-xs font-semibold text-[#6B7280]">
                Periode Jabatan
              </label>
              <input
                id="periode"
                type="text"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                placeholder="Contoh: 2026 - 2029"
                disabled={isSaving}
                className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] disabled:opacity-50"
              />
            </div>

            {/* No. WhatsApp (Privat/Admin saja) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="no_whatsapp" className="text-xs font-semibold text-[#6B7280]">
                No. WhatsApp <span className="text-[10px] text-[#9CA3AF]">(Hanya terlihat oleh admin)</span>
              </label>
              <input
                id="no_whatsapp"
                type="tel"
                value={noWhatsapp}
                onChange={(e) => setNoWhatsapp(e.target.value)}
                placeholder="Contoh: 081234567890"
                disabled={isSaving}
                className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] disabled:opacity-50"
              />
            </div>

            {/* Urutan & Status Aktif */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="urutan" className="text-xs font-semibold text-[#6B7280]">
                  Urutan Tampil
                </label>
                <input
                  id="urutan"
                  type="number"
                  min="0"
                  value={urutan}
                  onChange={(e) => setUrutan(parseInt(e.target.value, 10) || 0)}
                  disabled={isSaving}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#6B7280]">Status</label>
                <div className="flex h-full items-center">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={isAktif}
                      onChange={(e) => setIsAktif(e.target.checked)}
                      disabled={isSaving}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#346739] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none disabled:opacity-50" />
                    <span className="ml-3 text-sm font-medium text-[#1A1A1A]">
                      {isAktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-8 flex gap-3 border-t border-[#E5E7EB] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F3F4F6] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#346739] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
