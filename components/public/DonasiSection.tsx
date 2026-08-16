"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle, Clipboard, CreditCard, QrCode, Heart } from "lucide-react";

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
    <section className="bg-[#F9F6F0] py-14">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10">
            <Heart className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A2E1F]">
            Dukung Kemakmuran Masjid
          </h2>
          <p className="mt-2 text-sm text-[#8D9F96]">
            Setiap donasi Anda adalah amal jariyah yang mengalir tanpa henti
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Kolom Kiri — Info Rekening */}
          <div className="rounded-lg border border-[#F0EBE1] bg-white p-6 shadow-ambient">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F6F0]">
                <CreditCard className="h-4 w-4 text-[#0A2E1F]" />
              </div>
              <h3 className="text-base font-bold text-[#0A2E1F]">
                Informasi Rekening
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">Bank</p>
                <p className="mt-1 text-sm font-bold text-[#15221C]">{namaBank || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">No. Rekening</p>
                <p className="mt-1 text-lg font-bold tracking-wider text-[#0A2E1F]">
                  {noRekening || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8D9F96]">Atas Nama</p>
                <p className="mt-1 text-sm font-bold text-[#15221C]">{atasNama || "—"}</p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              disabled={!noRekening}
              className="ripple mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#0A2E1F] px-4 py-2.5 text-sm font-bold text-[#0A2E1F] transition-all hover:bg-[#0A2E1F] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="flex flex-col items-center rounded-lg border border-[#F0EBE1] bg-white p-6 shadow-ambient">
            <div className="mb-5 flex items-center gap-3 self-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F9F6F0]">
                <QrCode className="h-4 w-4 text-[#0A2E1F]" />
              </div>
              <h3 className="text-base font-bold text-[#0A2E1F]">Sedekah via QRIS</h3>
            </div>

            {qrisUrl ? (
              <div className="relative mx-auto h-[200px] w-[200px] overflow-hidden rounded-lg shadow-ambient">
                <Image
                  src={qrisUrl}
                  alt="QRIS Donasi Masjid"
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
            ) : (
              <div className="mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-[#F9F6F0]">
                <p className="text-sm text-[#8D9F96]">QRIS belum tersedia</p>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-[#8D9F96]">
              Scan menggunakan aplikasi e-wallet atau mobile banking Anda
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
