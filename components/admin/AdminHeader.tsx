"use client";

import { Menu, ShieldCheck } from "lucide-react";

interface AdminHeaderProps {
  judul: string;
  onToggleSidebar: () => void;
}

export default function AdminHeader({
  judul,
  onToggleSidebar,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#F0EBE1] bg-white px-4 md:px-6 shadow-ambient">
      {/* Tombol hamburger (mobile only) + Judul */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-[#0A2E1F] hover:bg-[#F9F6F0] lg:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-[#0A2E1F] md:text-xl">
          {judul}
        </h1>
      </div>

      {/* Kanan: info admin badge */}
      <div className="flex items-center gap-2 rounded-full border border-[#F0EBE1] bg-[#F9F6F0] px-3.5 py-1.5 shadow-sm">
        <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
        <span className="text-xs font-bold text-[#0A2E1F]">Administrator</span>
      </div>
    </header>
  );
}