"use client";

import { Download } from "lucide-react";

export default function UnduhPDFButton() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 text-[#0A2E1F] hover:text-[#D4AF37] transition-all duration-300 font-medium print:hidden"
    >
      <Download className="h-[18px] w-[18px]" />
      Unduh PDF
    </button>
  );
}
