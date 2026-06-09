"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="flex max-w-[420px] flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF2F2]">
          <AlertCircle className="h-8 w-8 text-[#DC2626]" />
        </div>
        <h1 className="text-lg font-bold text-[#1A1A1A]">
          Terjadi Kesalahan
        </h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Maaf, terjadi kesalahan saat memuat halaman. Silakan coba lagi atau
          kembali ke beranda.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Kode error: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={reset}
            className="bg-[#346739] hover:bg-[#2A5230] text-white"
          >
            Coba Lagi
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}