"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  namaMasjid: string;
}

const menuItems = [
  { href: "/", label: "Beranda" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/jadwal-jumat", label: "Jadwal Jumat" },
  { href: "/keuangan", label: "Keuangan" },
  { href: "/kepengurusan", label: "Kepengurusan" },
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
      <nav className="sticky top-0 z-50 border-b border-[#F0EBE1] bg-white shadow-ambient">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Logo & Nama Masjid */}
          <Link
            href="/"
            className="flex items-center gap-3 text-[#0A2E1F]"
          >
            {/* Mosque geometric SVG icon */}
            <div className="flex h-8 w-8 items-center justify-center">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0A2E1F]">
                <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"/>
                <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"/>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0A2E1F]">
              {namaMasjid}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-8 md:flex">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium transition-colors duration-200",
                  isActive(item.href)
                    ? "text-[#0A2E1F] font-bold"
                    : "text-[#8D9F96] hover:text-[#0A2E1F]",
                )}
              >
                {item.label}
                {/* Gold underline for active */}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#D4AF37]" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg p-2 text-[#0A2E1F] transition-colors hover:bg-[#F9F6F0] md:hidden"
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[280px] bg-white shadow-xl transition-transform duration-300 ease-smooth md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#F0EBE1] px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
            <span className="text-base font-bold text-[#0A2E1F]">
              {namaMasjid}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-[#8D9F96] transition-colors hover:bg-[#F9F6F0]"
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
                "flex items-center px-4 py-3.5 text-sm font-medium transition-colors border-b border-[#F0EBE1]",
                isActive(item.href)
                  ? "border-l-4 border-l-[#D4AF37] bg-[#F9F6F0] text-[#0A2E1F] font-bold pl-3"
                  : "text-[#15221C] hover:bg-[#F9F6F0]",
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