"use client";

import { useRouter } from "next/navigation";
import KeuanganForm from "@/components/admin/KeuanganForm";

export default function TambahTransaksiPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/keuangan");
    router.refresh();
  };

  const handleCancel = () => {
    router.push("/admin/keuangan");
  };

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="rounded-xl border border-[#D1D5DB] bg-white p-6 shadow-sm">
        <KeuanganForm
          mode="tambah"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
