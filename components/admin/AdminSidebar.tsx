"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Megaphone,
  Calendar,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeMenu: string;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { href: "/admin/jadwal-jumat", label: "Jadwal Jumat", icon: Calendar },
  { href: "/admin/kepengurusan", label: "Kepengurusan", icon: Users },
  { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/profil-masjid", label: "Info Masjid", icon: Settings },
];

export default function AdminSidebar({
  activeMenu,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0A2E1F] text-[#F9F6F0]">
      {/* Header Sidebar */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center text-[#D4AF37]">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
            <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"/>
            <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white">SIM Masjid</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">Admin Control</span>
        </div>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 text-sm font-semibold transition-all duration-200 rounded-lg",
                  isActive
                    ? "bg-[#15221C] text-[#D4AF37] border-l-4 border-[#D4AF37] rounded-l-none font-bold shadow-sm"
                    : "text-[#8D9F96] hover:bg-[#15221C]/60 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-[#D4AF37]" : "text-[#8D9F96]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Tombol Keluar */}
      <div className="border-t border-white/10 px-3 py-4">
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200"
        >
          <LogOut className="h-5 w-5 text-red-400" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] border-r border-white/10 bg-[#0A2E1F] lg:block shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[240px] bg-[#0A2E1F] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Dialog Konfirmasi Logout */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-[400px] rounded-2xl border border-[#F0EBE1] bg-white p-6 shadow-ambient">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0A2E1F]">Keluar dari Panel Admin</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#8D9F96]">
              Apakah Anda yakin ingin keluar dari panel admin? Anda harus masuk kembali untuk mengelola SIM Masjid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="flex-1 rounded-full border-[#F0EBE1] text-[#15221C] hover:bg-[#F9F6F0]"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoggingOut ? "Keluar..." : "Ya, Keluar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}