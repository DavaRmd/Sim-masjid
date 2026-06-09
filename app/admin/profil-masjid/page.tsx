"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, Image as ImageIcon, QrCode, Trash2, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import GaleriManager from "@/components/admin/GaleriManager";
import type { ProfilMasjid } from "@/types";

export default function AdminProfilMasjidPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [namaMasjid, setNamaMasjid] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [alamat, setAlamat] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [noRekening, setNoRekening] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [atasNama, setAtasNama] = useState("");

  // Existing data
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const [existingQrisUrl, setExistingQrisUrl] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  // File state
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  // Refs
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing data
  useEffect(() => {
    const fetchProfil = async () => {
      setIsLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("profil_masjid")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        toast.error("Gagal memuat data profil masjid", {
          description: error.message,
        });
        setIsLoading(false);
        return;
      }

      if (data) {
        const profil = data as ProfilMasjid;
        setExistingId(profil.id);
        setNamaMasjid(profil.nama_masjid ?? "");
        setDeskripsi(profil.deskripsi ?? "");
        setAlamat(profil.alamat ?? "");
        setLinkMaps(profil.link_maps ?? "");
        setNoRekening(profil.no_rekening ?? "");
        setNamaBank(profil.nama_bank ?? "");
        setAtasNama(profil.atas_nama ?? "");
        setExistingFotoUrl(profil.foto_url ?? null);
        setExistingQrisUrl(profil.qris_url ?? null);
      }

      setIsLoading(false);
    };

    fetchProfil();
  }, []);

  // Handle foto file selection
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  // Handle QRIS file selection
  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setQrisFile(file);
    setQrisPreview(URL.createObjectURL(file));
  };

  // Handle remove foto
  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fotoInputRef.current) {
      fotoInputRef.current.value = "";
    }
  };

  // Handle remove QRIS
  const handleRemoveQris = () => {
    setQrisFile(null);
    setQrisPreview(null);
    if (qrisInputRef.current) {
      qrisInputRef.current.value = "";
    }
  };

  // Handle delete existing foto
  const handleDeleteExistingFoto = () => {
    setExistingFotoUrl(null);
  };

  // Handle delete existing QRIS
  const handleDeleteExistingQris = () => {
    setExistingQrisUrl(null);
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!namaMasjid.trim()) {
      newErrors.namaMasjid = "Nama masjid wajib diisi";
    }
    if (!alamat.trim()) {
      newErrors.alamat = "Alamat lengkap wajib diisi";
    }

    // URL validation for Google Maps (optional)
    if (linkMaps.trim() && !linkMaps.trim().startsWith("http")) {
      newErrors.linkMaps =
        "Link Google Maps harus diawali http:// atau https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload file to Supabase Storage
  const uploadFile = async (
    file: File,
    bucket: string,
    path: string
  ): Promise<string | null> => {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Gagal mengupload file ke Supabase Storage:", error);
      toast.error("Gagal mengupload file", {
        description: error.message,
      });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  // Delete file from Supabase Storage
  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Failed to delete file:", error.message);
      return false;
    }
    return true;
  };

  // Extract path from public URL
  const extractStoragePath = (url: string, bucket: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex === -1) return null;
      return pathParts.slice(bucketIndex + 1).join("/");
    } catch {
      return null;
    }
  };

  // Handle simpan
  const handleSimpan = async () => {
    if (!validate()) return;

    setIsSaving(true);
    const supabase = createClient();

    let finalFotoUrl = existingFotoUrl;
    let finalQrisUrl = existingQrisUrl;

    // Upload new foto if selected
    if (fotoFile) {
      // Delete old foto if exists
      if (existingFotoUrl) {
        const oldPath = extractStoragePath(existingFotoUrl, "sim-masjid");
        if (oldPath) {
          await deleteFile("sim-masjid", oldPath);
        }
      }

      const ext = fotoFile.name.split(".").pop() || "jpg";
      const uploadedUrl = await uploadFile(
        fotoFile,
        "sim-masjid",
        `masjid/foto-masjid.${ext}`
      );
      if (!uploadedUrl) {
        setIsSaving(false);
        return;
      }
      finalFotoUrl = uploadedUrl;
    }

    // If existing foto was deleted and no new file uploaded
    if (existingFotoUrl === null && finalFotoUrl === existingFotoUrl && !fotoFile) {
      // User deleted existing but didn't upload new — remove from DB
      finalFotoUrl = null;
    }

    // Upload new QRIS if selected
    if (qrisFile) {
      // Delete old QRIS if exists
      if (existingQrisUrl) {
        const oldPath = extractStoragePath(existingQrisUrl, "sim-masjid");
        if (oldPath) {
          await deleteFile("sim-masjid", oldPath);
        }
      }

      const ext = qrisFile.name.split(".").pop() || "jpg";
      const uploadedUrl = await uploadFile(
        qrisFile,
        "sim-masjid",
        `qris/qris-aktif.${ext}`
      );
      if (!uploadedUrl) {
        setIsSaving(false);
        return;
      }
      finalQrisUrl = uploadedUrl;
    }

    // If existing QRIS was deleted and no new file uploaded
    if (existingQrisUrl === null && finalQrisUrl === existingQrisUrl && !qrisFile) {
      finalQrisUrl = null;
    }

    // Update profil_masjid
    const { error } = await supabase
      .from("profil_masjid")
      .update({
        nama_masjid: namaMasjid.trim(),
        deskripsi: deskripsi.trim() || null,
        alamat: alamat.trim(),
        link_maps: linkMaps.trim() || null,
        no_rekening: noRekening.trim() || null,
        nama_bank: namaBank.trim() || null,
        atas_nama: atasNama.trim() || null,
        foto_url: finalFotoUrl,
        qris_url: finalQrisUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId!);

    if (error) {
      toast.error("Gagal menyimpan data", {
        description: error.message,
      });
      setIsSaving(false);
      return;
    }

    // Update local state to reflect saved values
    setExistingFotoUrl(finalFotoUrl);
    setExistingQrisUrl(finalQrisUrl);
    setFotoFile(null);
    setFotoPreview(null);
    setQrisFile(null);
    setQrisPreview(null);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (qrisInputRef.current) qrisInputRef.current.value = "";

    toast.success("Informasi masjid berhasil diperbarui");
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div>
        <h2 className="text-xl font-bold text-[#1A1A1A]">Informasi Masjid</h2>
        <p className="mt-0.5 text-sm text-[#6B7280]">
          Kelola informasi profil masjid yang akan ditampilkan di halaman publik
        </p>
      </div>

      {/* ========== FORM ========== */}
      <div className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column 1 — Text fields */}
          <div className="space-y-5">
            {/* Nama Masjid */}
            <div className="space-y-1.5">
              <label
                htmlFor="nama-masjid"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Nama Masjid <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="nama-masjid"
                type="text"
                value={namaMasjid}
                onChange={(e) => {
                  setNamaMasjid(e.target.value);
                  if (errors.namaMasjid) setErrors((p) => ({ ...p, namaMasjid: "" }));
                }}
                placeholder="Contoh: Masjid Al-Ikhlas"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] ${
                  errors.namaMasjid ? "border-[#DC2626]" : "border-[#D1D5DB]"
                }`}
              />
              {errors.namaMasjid && (
                <p className="text-xs text-[#DC2626]">{errors.namaMasjid}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label
                htmlFor="deskripsi"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Deskripsi
              </label>
              <textarea
                id="deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Deskripsi singkat tentang masjid..."
                rows={3}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] resize-vertical"
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5">
              <label
                htmlFor="alamat"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Alamat Lengkap <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                id="alamat"
                value={alamat}
                onChange={(e) => {
                  setAlamat(e.target.value);
                  if (errors.alamat) setErrors((p) => ({ ...p, alamat: "" }));
                }}
                placeholder="Alamat lengkap masjid..."
                rows={2}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] resize-vertical ${
                  errors.alamat ? "border-[#DC2626]" : "border-[#D1D5DB]"
                }`}
              />
              {errors.alamat && (
                <p className="text-xs text-[#DC2626]">{errors.alamat}</p>
              )}
            </div>

            {/* Link Google Maps */}
            <div className="space-y-1.5">
              <label
                htmlFor="link-maps"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Link Google Maps
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="link-maps"
                  type="url"
                  value={linkMaps}
                  onChange={(e) => {
                    setLinkMaps(e.target.value);
                    if (errors.linkMaps) setErrors((p) => ({ ...p, linkMaps: "" }));
                  }}
                  placeholder="https://maps.google.com/..."
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739] ${
                    errors.linkMaps ? "border-[#DC2626]" : "border-[#D1D5DB]"
                  }`}
                />
              </div>
              {errors.linkMaps && (
                <p className="text-xs text-[#DC2626]">{errors.linkMaps}</p>
              )}
              <p className="text-xs text-[#9CA3AF]">
                Contoh: https://maps.google.com/...
              </p>
            </div>
          </div>

          {/* Column 2 — Bank, WhatsApp, Foto, QRIS */}
          <div className="space-y-5">
            {/* Nomor Rekening */}
            <div className="space-y-1.5">
              <label
                htmlFor="no-rekening"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Nomor Rekening
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  id="no-rekening"
                  type="text"
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value)}
                  placeholder="Nomor rekening"
                  className="w-full rounded-lg border border-[#D1D5DB] py-2.5 pl-10 pr-3 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
                />
              </div>
            </div>

            {/* Nama Bank */}
            <div className="space-y-1.5">
              <label
                htmlFor="nama-bank"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Nama Bank
              </label>
              <input
                id="nama-bank"
                type="text"
                value={namaBank}
                onChange={(e) => setNamaBank(e.target.value)}
                placeholder="Contoh: BSI, BRI, BCA"
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
              />
              <p className="text-xs text-[#9CA3AF]">
                Contoh: BSI, BRI, BCA
              </p>
            </div>

            {/* Atas Nama */}
            <div className="space-y-1.5">
              <label
                htmlFor="atas-nama"
                className="text-sm font-medium text-[#1A1A1A]"
              >
                Atas Nama
              </label>
              <input
                id="atas-nama"
                type="text"
                value={atasNama}
                onChange={(e) => setAtasNama(e.target.value)}
                placeholder="Nama pemilik rekening"
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#346739] focus:outline-none focus:ring-1 focus:ring-[#346739]"
              />
            </div>

          </div>
        </div>

        {/* ========== FOTO MASJID SECTION ========== */}
        <div className="mt-8 border-t border-[#E5E7EB] pt-6">
          <h3 className="mb-4 text-base font-semibold text-[#1A1A1A]">
            Foto Masjid
          </h3>

          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {/* Preview */}
            <div className="flex-shrink-0">
              {(fotoPreview || existingFotoUrl) ? (
                <div className="relative overflow-hidden rounded-xl border border-[#D1D5DB]">
                  <Image
                    src={fotoPreview || existingFotoUrl || ""}
                    alt="Foto Masjid"
                    width={320}
                    height={200}
                    className="h-[200px] w-[320px] object-cover"
                    unoptimized={!!existingFotoUrl && !fotoPreview}
                  />
                </div>
              ) : (
                <div className="flex h-[200px] w-[320px] items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAF9]">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-[#9CA3AF]" />
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      Belum ada foto
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#6B7280]">
                Upload foto masjid untuk ditampilkan di halaman beranda. Format JPG, PNG, atau WebP. Maksimal 5MB.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fotoInputRef.current?.click()}
                  className="text-sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {existingFotoUrl || fotoPreview ? "Ganti Foto" : "Upload Foto"}
                </Button>

                {(fotoPreview) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveFoto}
                    className="text-sm text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Batal Ganti
                  </Button>
                )}

                {existingFotoUrl && !fotoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteExistingFoto}
                    className="text-sm text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Foto
                  </Button>
                )}
              </div>

              <input
                ref={fotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* ========== QRIS SECTION ========== */}
        <div className="mt-6 border-t border-[#E5E7EB] pt-6">
          <h3 className="mb-4 text-base font-semibold text-[#1A1A1A]">
            Gambar QRIS
          </h3>

          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {/* Preview */}
            <div className="flex-shrink-0">
              {(qrisPreview || existingQrisUrl) ? (
                <div className="relative overflow-hidden rounded-xl border border-[#D1D5DB]">
                  <Image
                    src={qrisPreview || existingQrisUrl || ""}
                    alt="QRIS"
                    width={200}
                    height={200}
                    className="h-[200px] w-[200px] object-contain"
                    unoptimized={!!existingQrisUrl && !qrisPreview}
                  />
                </div>
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAF9]">
                  <div className="text-center">
                    <QrCode className="mx-auto h-8 w-8 text-[#9CA3AF]" />
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      Belum ada QRIS
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#6B7280]">
                Upload gambar QRIS terbaru dari aplikasi bank/e-wallet Anda. Format JPG, PNG, atau WebP. Maksimal 5MB.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => qrisInputRef.current?.click()}
                  className="text-sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {existingQrisUrl || qrisPreview ? "Ganti QRIS" : "Upload QRIS"}
                </Button>

                {(qrisPreview) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveQris}
                    className="text-sm text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Batal Ganti
                  </Button>
                )}

                {existingQrisUrl && !qrisPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteExistingQris}
                    className="text-sm text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus QRIS
                  </Button>
                )}
              </div>

              <input
                ref={qrisInputRef}
                type="file"
                accept="image/*"
                onChange={handleQrisChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* ========== SUBMIT BUTTON ========== */}
        <div className="mt-8 border-t border-[#E5E7EB] pt-6">
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={handleSimpan}
              disabled={isSaving}
              className="bg-[#346739] hover:bg-[#2A5230] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ========== GALERI FOTO ========== */}
      <GaleriManager />
    </div>
  );
}