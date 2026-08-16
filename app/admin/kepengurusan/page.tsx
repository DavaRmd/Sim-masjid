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
    <div className="space-y-8">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">
            Kelola Kepengurusan DKM
          </h1>
          <p className="mt-1 text-sm text-[#8D9F96]">
            Kelola data struktur dan susunan pengurus Dewan Kemakmuran Masjid.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-full bg-[#0A2E1F] px-6 py-2.5 text-sm font-bold text-white shadow-ambient transition-all hover:bg-[#15221C] hover:shadow-hover"
        >
          <Plus className="h-4 w-4" />
          Tambah Anggota
        </button>
      </div>

      {/* ========== TABEL KEPENGURUSAN ========== */}
      <div className="overflow-hidden rounded-2xl border border-[#F0EBE1] bg-white shadow-ambient">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0EBE1] bg-[#F9F6F0] text-left">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[60px]">
                  No
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[80px]">
                  Foto
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Nama Lengkap
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Jabatan
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96]">
                  Periode
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[100px] text-center">
                  Urutan
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[100px] text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#8D9F96] w-[120px] text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {isLoading ? (
                // Skeleton Loader
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-6 rounded bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="h-10 w-10 rounded-full bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-4 w-8 rounded bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-5 w-16 rounded bg-[#F0EBE1]" /></td>
                    <td className="px-6 py-4"><div className="mx-auto h-8 w-20 rounded bg-[#F0EBE1]" /></td>
                  </tr>
                ))
              ) : pengurusList.length > 0 ? (
                pengurusList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors duration-150 ${idx % 2 === 0 ? "bg-white" : "bg-[#F9F6F0]/40"} hover:bg-[#F9F6F0]`}
                  >
                    <td className="px-6 py-4 text-[#8D9F96] font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#F0EBE1] bg-[#F9F6F0]">
                        {item.foto_url ? (
                          <Image
                            src={item.foto_url}
                            alt={item.nama}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#8D9F96]">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#15221C]">
                      {item.nama}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#0A2E1F]/10 px-3 py-1 text-xs font-bold text-[#0A2E1F]">
                        {item.jabatan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#8D9F96]">
                      {item.periode || "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-[#15221C] font-semibold">
                      {item.urutan}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                          item.is_aktif
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item.is_aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={deletingId === item.id}
                          className="rounded-full p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50"
                          title="Edit anggota"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleHapusKonfirmasi(item)}
                          disabled={deletingId === item.id}
                          className="rounded-full p-2 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Hapus anggota"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm font-medium text-[#8D9F96]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Users className="h-10 w-10 text-[#8D9F96]/40" />
                      <div>
                        <p className="font-bold text-[#0A2E1F]">Belum ada data pengurus</p>
                        <p className="mt-1 text-xs text-[#8D9F96]">
                          Klik &ldquo;Tambah Anggota&rdquo; di atas untuk memasukkan pengurus baru.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#F0EBE1] bg-white p-6 shadow-ambient">
            <h4 className="text-lg font-bold text-[#0A2E1F]">
              Hapus Anggota Pengurus?
            </h4>
            <p className="mt-2 text-sm text-[#8D9F96]">
              Apakah Anda yakin ingin menghapus <strong className="text-[#0A2E1F]">{confirmDeleteData.nama}</strong>? Foto profil pengurus juga akan terhapus secara permanen.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleHapusBatal}
                className="flex-1 rounded-full border border-[#F0EBE1] px-4 py-2.5 text-sm font-semibold text-[#15221C] hover:bg-[#F9F6F0] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleHapus(confirmDeleteData)}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
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

