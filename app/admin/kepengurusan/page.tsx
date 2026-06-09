"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, User, Users } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Kepengurusan } from "@/types";
import KepengurusanForm from "@/components/admin/KepengurusanForm";

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

export default function AdminKepengurusanPage() {
  const [pengurusList, setPengurusList] = useState<Kepengurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<Kepengurusan | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteData, setConfirmDeleteData] = useState<Kepengurusan | null>(null);

  // Fetch data pengurus dari database
  const fetchPengurus = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("kepengurusan")
      .select("*")
      .order("urutan", { ascending: true });

    if (error) {
      toast.error("Gagal memuat data pengurus");
      console.error(error);
    } else {
      setPengurusList((data as Kepengurusan[]) ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPengurus();
  }, [fetchPengurus]);

  // Handle Edit Click
  const handleEdit = (pengurus: Kepengurusan) => {
    setEditingData(pengurus);
    setIsFormOpen(true);
  };

  // Handle Tambah Click
  const handleAdd = () => {
    setEditingData(null);
    setIsFormOpen(true);
  };

  // Handle Hapus Click (Buka Dialog Konfirmasi)
  const handleHapusKonfirmasi = (pengurus: Kepengurusan) => {
    setConfirmDeleteData(pengurus);
  };

  const handleHapusBatal = () => {
    setConfirmDeleteData(null);
  };

  // Eksekusi Hapus Anggota
  const handleHapus = async (pengurus: Kepengurusan) => {
    setDeletingId(pengurus.id);
    setConfirmDeleteData(null);
    const supabase = createClient();

    try {
      // 1. Hapus foto dari storage (jika ada)
      if (pengurus.foto_url) {
        const path = extractStoragePath(pengurus.foto_url);
        if (path) {
          await supabase.storage.from("sim-masjid").remove([path]);
        }
      }

      // 2. Hapus data dari tabel database
      const { error } = await supabase
        .from("kepengurusan")
        .delete()
        .eq("id", pengurus.id);

      if (error) throw error;

      toast.success("Anggota pengurus berhasil dihapus");
      await fetchPengurus();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Gagal menghapus anggota pengurus";
      toast.error(errMsg);
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* ========== HEADER ========== */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A] md:text-2xl">
            Kelola Kepengurusan DKM
          </h1>
          <p className="text-xs text-[#6B7280]">
            Kelola susunan anggota pengurus Dewan Kemakmuran Masjid (DKM).
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-[#346739] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A5230]"
        >
          <Plus className="h-4 w-4" />
          Tambah Anggota
        </button>
      </div>

      {/* ========== TABEL KEPENGURUSAN ========== */}
      <div className="overflow-hidden rounded-xl border border-[#D1D5DB] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#EAF2EB] text-left">
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739] w-[60px]">
                  No
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739] w-[80px]">
                  Foto
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739]">
                  Nama Lengkap
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739]">
                  Jabatan
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739]">
                  Periode
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739] w-[100px] text-center">
                  Urutan
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739] w-[100px] text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#346739] w-[120px] text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                // Skeleton Loader
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-6 rounded bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="h-10 w-10 rounded-full bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-4 w-8 rounded bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-5 w-16 rounded bg-[#E5E7EB]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-8 w-20 rounded bg-[#E5E7EB]" /></td>
                  </tr>
                ))
              ) : pengurusList.length > 0 ? (
                pengurusList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#F9FAF9]"}
                  >
                    <td className="px-6 py-4 text-[#6B7280] font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#D1D5DB] bg-muted">
                        {item.foto_url ? (
                          <Image
                            src={item.foto_url}
                            alt={item.nama}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#F3F4F6] text-[#9CA3AF]">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1A1A1A]">
                      {item.nama}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#EAF2EB] px-2.5 py-0.5 text-xs font-semibold text-[#346739]">
                        {item.jabatan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">
                      {item.periode || "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-[#6B7280] font-medium">
                      {item.urutan}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.is_aktif
                            ? "bg-[#F0FDF4] text-[#16A34A]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {item.is_aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#346739] transition-colors hover:bg-[#EAF2EB] disabled:opacity-50"
                          title="Edit anggota"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleHapusKonfirmasi(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#DC2626] transition-colors hover:bg-[#FEF2F2] disabled:opacity-50"
                          title="Hapus anggota"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="h-10 w-10 text-[#9CA3AF]" />
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">Belum ada data pengurus</p>
                        <p className="text-xs text-[#9CA3AF]">
                          Klik &ldquo;Tambah Anggota&rdquo; untuk memasukkan data baru.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== FORM MODAL KEPENGURUSAN ========== */}
      <KepengurusanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchPengurus}
        editingData={editingData}
      />

      {/* ========== DIALOG KONFIRMASI HAPUS ========== */}
      {confirmDeleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="mb-2 text-base font-semibold text-[#1A1A1A]">
              Hapus Anggota Pengurus?
            </h4>
            <p className="mb-6 text-sm text-[#6B7280]">
              Apakah Anda yakin ingin menghapus <strong>{confirmDeleteData.nama}</strong>? Foto profil juga akan terhapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleHapusBatal}
                className="flex-1 rounded-xl border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F3F4F6]"
              >
                Batal
              </button>
              <button
                onClick={() => handleHapus(confirmDeleteData)}
                className="flex-1 rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B91C1C]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
