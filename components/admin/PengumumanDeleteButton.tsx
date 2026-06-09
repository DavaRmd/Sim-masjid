"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Pengumuman } from "@/types";

interface PengumumanDeleteButtonProps {
  pengumuman: Pengumuman;
}

export default function PengumumanDeleteButton({ pengumuman }: PengumumanDeleteButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();

    // Soft delete: set is_aktif = false
    const { error } = await supabase
      .from("pengumuman")
      .update({ is_aktif: false })
      .eq("id", pengumuman.id);

    if (!error) {
      setShowDialog(false);
      router.refresh();
    }

    setIsDeleting(false);
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
        title="Hapus pengumuman"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Hapus Pengumuman</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengumuman &ldquo;{pengumuman.judul}&rdquo;?
              Pengumuman akan disembunyikan dari halaman publik.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}