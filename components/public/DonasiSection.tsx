"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, Clipboard, CreditCard, QrCode } from "lucide-react";

interface DonasiSectionProps {
  noRekening: string | null;
  namaBank: string | null;
  atasNama: string | null;
  qrisUrl: string | null;
}

export default function DonasiSection({
  noRekening,
  namaBank,
  atasNama,
  qrisUrl,
}: DonasiSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!noRekening) return;
    try {
      await navigator.clipboard.writeText(noRekening);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = noRekening;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="bg-[#346739] py-12">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Dukung Masjid Kita
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Setiap donasi Anda adalah amal jariyah
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Kolom Kiri — Info Rekening */}
          <div className="rounded-xl bg-white/10 p-5">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white" />
              <h3 className="text-base font-semibold text-white">
                Informasi Rekening
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/70">Bank</p>
                <p className="text-sm font-semibold text-white">
                  {namaBank || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/70">No. Rekening</p>
                <p className="text-sm font-semibold text-white">
                  {noRekening || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/70">Atas Nama</p>
                <p className="text-sm font-semibold text-white">
                  {atasNama || "-"}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              disabled={!noRekening}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#346739] transition hover:bg-[#EAF2EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4" />
                  Salin Nomor Rekening
                </>
              )}
            </button>
          </div>

          {/* Kolom Kanan — QRIS */}
          <div className="rounded-xl bg-white/10 p-5 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-white" />
              <h3 className="text-base font-semibold text-white">
                Sedekah via QRIS
              </h3>
            </div>

            {qrisUrl ? (
              <div className="relative mx-auto h-[200px] w-[200px] overflow-hidden rounded-xl shadow-md">
                <Image
                  src={qrisUrl}
                  alt="QRIS Donasi Masjid"
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
            ) : (
              <div className="mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-xl bg-white/20">
                <p className="text-sm text-white/60">QRIS belum tersedia</p>
              </div>
            )}

            <p className="mt-3 text-xs text-white/70">
              Scan menggunakan aplikasi e-wallet atau mobile banking
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}