"use client";

import { Menu } from "lucide-react";

interface AdminHeaderProps {
  judul: string;
  onToggleSidebar: () => void;
}

export default function AdminHeader({
  judul,
  onToggleSidebar,
}: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center border-b border-border bg-white px-4 md:px-6">
      {/* Tombol hamburger (mobile only) + Judul */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-foreground hover:bg-muted md:hidden"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{judul}</h1>
      </div>

      {/* Kanan: info admin */}
      <div className="ml-auto">
        <span className="text-sm text-muted-foreground">Admin</span>
      </div>
    </header>
  );
}