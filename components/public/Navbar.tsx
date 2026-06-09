"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  namaMasjid: string;
}

const menuItems = [
  { href: "/", label: "Beranda" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/jadwal-jumat", label: "Jadwal Jumat" },
  { href: "/keuangan", label: "Keuangan" },
];

export default function Navbar({ namaMasjid }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-16 bg-primary shadow-md">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Logo & Nama Masjid */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-white"
          >
            <Home className="h-5 w-5" />
            <span>{namaMasjid}</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-6 md:flex">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-white transition-opacity hover:opacity-80",
                  isActive(item.href) && "underline underline-offset-8",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[280px] bg-white shadow-xl transition-transform duration-300 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-base font-semibold text-primary">
            {namaMasjid}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-foreground hover:bg-muted"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Menu */}
        <div className="flex flex-col py-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors border-b border-border",
                isActive(item.href)
                  ? "bg-primary-light text-primary border-l-4 border-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}